const axios = require('axios');

/**
 * Integration layer for external services
 * RFZO (Republic Fund for Health Insurance), IZJZS (Institute for Public Health), LIS/RIS
 */

class ExternalServicesIntegration {
  constructor() {
    this.rfzoBaseUrl = process.env.RFZO_API_URL || '';
    this.izjzsBaseUrl = process.env.IZJZS_API_URL || '';
    this.lisBaseUrl = process.env.LIS_API_URL || '';
    this.risBaseUrl = process.env.RIS_API_URL || '';
    
    this.rfzoApiKey = process.env.RFZO_API_KEY || '';
    this.izjzsApiKey = process.env.IZJZS_API_KEY || '';
  }

  /**
   * RFZO Integration - Verify insurance coverage
   */
  async verifyInsurance(insuranceNumber) {
    try {
      if (!this.rfzoBaseUrl) {
        console.warn('RFZO API URL not configured');
        return { verified: false, message: 'RFZO service not configured' };
      }

      const response = await axios.post(
        `${this.rfzoBaseUrl}/verify-insurance`,
        { insuranceNumber },
        {
          headers: {
            'Authorization': `Bearer ${this.rfzoApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return {
        verified: response.data.verified || false,
        patientInfo: response.data.patientInfo,
        coverageDetails: response.data.coverageDetails,
        expiryDate: response.data.expiryDate
      };
    } catch (error) {
      console.error('RFZO verification error:', error.message);
      return { 
        verified: false, 
        error: error.message,
        message: 'Failed to verify insurance with RFZO'
      };
    }
  }

  /**
   * RFZO Integration - Submit claim
   */
  async submitClaim(claimData) {
    try {
      if (!this.rfzoBaseUrl) {
        throw new Error('RFZO API URL not configured');
      }

      const response = await axios.post(
        `${this.rfzoBaseUrl}/claims`,
        claimData,
        {
          headers: {
            'Authorization': `Bearer ${this.rfzoApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        claimId: response.data.claimId,
        status: response.data.status,
        response: response.data
      };
    } catch (error) {
      console.error('RFZO claim submission error:', error.message);
      throw error;
    }
  }

  /**
   * IZJZS Integration - Submit epidemiological data
   */
  async submitEpidemiologicalData(data) {
    try {
      if (!this.izjzsBaseUrl) {
        console.warn('IZJZS API URL not configured');
        return { success: false, message: 'IZJZS service not configured' };
      }

      const response = await axios.post(
        `${this.izjzsBaseUrl}/epidemiological`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.izjzsApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        submissionId: response.data.submissionId,
        response: response.data
      };
    } catch (error) {
      console.error('IZJZS submission error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * IZJZS Integration - Get ICD-10 codes
   */
  async getICD10Codes(searchTerm = '') {
    try {
      if (!this.izjzsBaseUrl) {
        // Fallback to local ICD-10 codes or mock data
        return this.getLocalICD10Codes(searchTerm);
      }

      const response = await axios.get(
        `${this.izjzsBaseUrl}/icd10`,
        {
          params: { search: searchTerm },
          headers: {
            'Authorization': `Bearer ${this.izjzsApiKey}`
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('IZJZS ICD-10 fetch error:', error.message);
      return this.getLocalICD10Codes(searchTerm);
    }
  }

  /**
   * Local ICD-10 codes (fallback)
   */
  getLocalICD10Codes(searchTerm) {
    // Common ICD-10 codes
    const commonCodes = [
      { code: 'I10', description: 'Essential (primary) hypertension' },
      { code: 'E11', description: 'Type 2 diabetes mellitus' },
      { code: 'J06', description: 'Acute upper respiratory infections' },
      { code: 'Z00', description: 'General examination without complaint' },
      { code: 'K25', description: 'Gastric ulcer' },
      { code: 'M79', description: 'Other soft tissue disorders' }
    ];

    if (!searchTerm) return commonCodes;

    const search = searchTerm.toLowerCase();
    return commonCodes.filter(item => 
      item.code.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search)
    );
  }

  /**
   * LIS (Laboratory Information System) Integration - Send lab order
   */
  async sendLabOrder(orderData) {
    try {
      if (!this.lisBaseUrl) {
        console.warn('LIS API URL not configured');
        return { success: false, message: 'LIS service not configured' };
      }

      const response = await axios.post(
        `${this.lisBaseUrl}/orders`,
        {
          patientId: orderData.patientId,
          orderNumber: orderData.orderNumber,
          testType: orderData.testType,
          testName: orderData.testName,
          orderedBy: orderData.orderedBy,
          orderedDate: orderData.orderedDate
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.LIS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        externalOrderId: response.data.orderId,
        status: response.data.status,
        estimatedCompletion: response.data.estimatedCompletion
      };
    } catch (error) {
      console.error('LIS order submission error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * LIS Integration - Receive lab results webhook
   */
  async receiveLabResults(resultData) {
    try {
      // This would typically be called via webhook from LIS system
      return {
        success: true,
        processed: true,
        resultData
      };
    } catch (error) {
      console.error('LIS results processing error:', error.message);
      throw error;
    }
  }

  /**
   * RIS (Radiology Information System) Integration - Send imaging order
   */
  async sendImagingOrder(orderData) {
    try {
      if (!this.risBaseUrl) {
        console.warn('RIS API URL not configured');
        return { success: false, message: 'RIS service not configured' };
      }

      const response = await axios.post(
        `${this.risBaseUrl}/orders`,
        {
          patientId: orderData.patientId,
          orderNumber: orderData.orderNumber,
          examType: orderData.examType,
          bodyPart: orderData.bodyPart,
          orderedBy: orderData.orderedBy
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RIS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return {
        success: true,
        externalOrderId: response.data.orderId,
        appointmentTime: response.data.appointmentTime,
        instructions: response.data.instructions
      };
    } catch (error) {
      console.error('RIS order submission error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * RIS Integration - Receive imaging results webhook
   */
  async receiveImagingResults(resultData) {
    try {
      // This would typically be called via webhook from RIS system
      return {
        success: true,
        processed: true,
        resultData
      };
    } catch (error) {
      console.error('RIS results processing error:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ExternalServicesIntegration();