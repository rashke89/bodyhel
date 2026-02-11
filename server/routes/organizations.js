const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

const isSystemAdmin = (user) =>
  user.role === "admin" && !user.organization;

// Get current admin's organization
router.get("/me", authorize("admin"), async (req, res) => {
  try {
    if (!req.user.organization) {
      return res
        .status(404)
        .json({ error: "Admin is not assigned to any organization" });
    }

    const organization = await Organization.findById(req.user.organization);

    if (!organization) {
      return res
        .status(404)
        .json({ error: "Organization not found" });
    }

    res.json({ organization });
  } catch (error) {
    console.error("Get organization (me) error:", error);
    res.status(500).json({ error: "Failed to fetch organization" });
  }
});

// Update current admin's organization settings
router.put("/me", authorize("admin"), async (req, res) => {
  try {
    if (!req.user.organization) {
      return res
        .status(404)
        .json({ error: "Admin is not assigned to any organization" });
    }

    const organization = await Organization.findById(
      req.user.organization,
    );

    if (!organization) {
      return res
        .status(404)
        .json({ error: "Organization not found" });
    }

    const {
      name,
      legalName,
      logoUrl,
      phone,
      email,
      address,
    } = req.body;

    if (name !== undefined) organization.name = name;
    if (legalName !== undefined) organization.legalName = legalName;
    if (logoUrl !== undefined) organization.logoUrl = logoUrl;
    if (phone !== undefined) organization.phone = phone;
    if (email !== undefined) organization.email = email;
    if (address !== undefined) {
      organization.address = {
        ...organization.address?.toObject?.() || organization.address || {},
        ...address,
      };
    }

    await organization.save();

    res.json({
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Update organization (me) error:", error);
    res
      .status(500)
      .json({ error: "Failed to update organization", details: error.message });
  }
});

// ===== System admin (global) organization CRUD =====

// List organizations
router.get("/", authorize("admin"), async (req, res) => {
  try {
    if (!isSystemAdmin(req.user)) {
      return res
        .status(403)
        .json({ error: "Access denied" });
    }

    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const organizations = await Organization.find(query).sort({
      name: 1,
    });

    res.json({ organizations });
  } catch (error) {
    console.error("List organizations error:", error);
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

// Create organization
router.post("/", authorize("admin"), async (req, res) => {
  try {
    if (!isSystemAdmin(req.user)) {
      return res
        .status(403)
        .json({ error: "Access denied" });
    }

    const {
      name,
      type,
      legalName,
      taxId,
      logoUrl,
      phone,
      email,
      address,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPhone,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }

    if (!adminFirstName || !adminLastName || !adminEmail) {
      return res.status(400).json({
        error:
          "adminFirstName, adminLastName and adminEmail are required for organization admin creation",
      });
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ error: "Admin user with this email already exists" });
    }

    const org = new Organization({
      name,
      type,
      legalName,
      taxId,
      logoUrl,
      phone,
      email,
      address,
    });

    await org.save();

    const DEFAULT_ORG_ADMIN_PASSWORD = "adminUser123";

    const organizationAdmin = new User({
      email: adminEmail,
      password: DEFAULT_ORG_ADMIN_PASSWORD,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: "admin",
      phone: adminPhone,
      organization: org._id,
      isActive: true,
    });

    await organizationAdmin.save();

    res.status(201).json({
      message: "Organization created successfully",
      organization: org,
      admin: {
        id: organizationAdmin._id,
        email: organizationAdmin.email,
        firstName: organizationAdmin.firstName,
        lastName: organizationAdmin.lastName,
        defaultPassword: DEFAULT_ORG_ADMIN_PASSWORD,
      },
    });
  } catch (error) {
    console.error("Create organization error:", error);
    res
      .status(500)
      .json({ error: "Failed to create organization", details: error.message });
  }
});

// Get organization by ID
router.get("/:id", authorize("admin"), async (req, res) => {
  try {
    if (!isSystemAdmin(req.user)) {
      return res
        .status(403)
        .json({ error: "Access denied" });
    }

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json({ organization: org });
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({ error: "Failed to fetch organization" });
  }
});

// Update organization by ID
router.put("/:id", authorize("admin"), async (req, res) => {
  try {
    if (!isSystemAdmin(req.user)) {
      return res
        .status(403)
        .json({ error: "Access denied" });
    }

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const {
      name,
      type,
      legalName,
      taxId,
      logoUrl,
      phone,
      email,
      address,
      isActive,
    } = req.body;

    if (name !== undefined) org.name = name;
    if (type !== undefined) org.type = type;
    if (legalName !== undefined) org.legalName = legalName;
    if (taxId !== undefined) org.taxId = taxId;
    if (logoUrl !== undefined) org.logoUrl = logoUrl;
    if (phone !== undefined) org.phone = phone;
    if (email !== undefined) org.email = email;
    if (address !== undefined) {
      org.address = {
        ...org.address?.toObject?.() || org.address || {},
        ...address,
      };
    }
    if (isActive !== undefined) org.isActive = isActive;

    await org.save();

    res.json({
      message: "Organization updated successfully",
      organization: org,
    });
  } catch (error) {
    console.error("Update organization error:", error);
    res
      .status(500)
      .json({ error: "Failed to update organization", details: error.message });
  }
});

// Delete organization (soft delete via isActive = false)
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    if (!isSystemAdmin(req.user)) {
      return res
        .status(403)
        .json({ error: "Access denied" });
    }

    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    org.isActive = false;
    await org.save();

    // Optionally deactivate users of this organization
    await User.updateMany(
      { organization: org._id },
      { isActive: false },
    );

    res.json({ message: "Organization deactivated successfully" });
  } catch (error) {
    console.error("Delete organization error:", error);
    res
      .status(500)
      .json({ error: "Failed to delete organization", details: error.message });
  }
});

module.exports = router;

