const BankAccount = require('../models/BankAccount');
const QRCode = require('qrcode');

// Get all bank accounts (Super Admin only)
const getAllBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find().sort({ createdAt: -1 });
    res.json({ bankAccounts: accounts });
  } catch (error) {
    console.error('Get all bank accounts error:', error);
    res.status(500).json({ error: 'Error fetching bank accounts' });
  }
};

// Get active bank accounts (for payment page)
const getActiveBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ isActive: true });
    res.json({ bankAccounts: accounts });
  } catch (error) {
    console.error('Get active bank accounts error:', error);
    res.status(500).json({ error: 'Error fetching bank accounts' });
  }
};

// Add new bank account (Super Admin only)
const addBankAccount = async (req, res) => {
  try {
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType,
      upiId,
      isPrimary
    } = req.body;

    // Check if account number already exists
    const existingAccount = await BankAccount.findOne({ accountNumber });
    if (existingAccount) {
      return res.status(400).json({ error: 'Account number already exists' });
    }

    const bankAccount = new BankAccount({
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType,
      upiId,
      isPrimary,
      addedBy: req.userId
    });

    await bankAccount.save();

    res.status(201).json({
      message: 'Bank account added successfully',
      bankAccount
    });
  } catch (error) {
    console.error('Add bank account error:', error);
    res.status(500).json({ error: 'Error adding bank account' });
  }
};

// Update bank account (Super Admin only)
const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const bankAccount = await BankAccount.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.json({
      message: 'Bank account updated successfully',
      bankAccount
    });
  } catch (error) {
    console.error('Update bank account error:', error);
    res.status(500).json({ error: 'Error updating bank account' });
  }
};

// Toggle bank account active status (Super Admin only)
const toggleBankAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const bankAccount = await BankAccount.findById(id);

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    bankAccount.isActive = !bankAccount.isActive;
    await bankAccount.save();

    res.json({
      message: `Bank account ${bankAccount.isActive ? 'activated' : 'deactivated'} successfully`,
      bankAccount
    });
  } catch (error) {
    console.error('Toggle bank account status error:', error);
    res.status(500).json({ error: 'Error updating bank account status' });
  }
};

// Delete bank account (Super Admin only)
const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const bankAccount = await BankAccount.findByIdAndDelete(id);

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.json({
      message: 'Bank account deleted successfully'
    });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ error: 'Error deleting bank account' });
  }
};

// Set primary bank account (Super Admin only)
const setPrimaryBankAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // First, unset all primary accounts
    await BankAccount.updateMany({ isPrimary: true }, { isPrimary: false });

    // Then set the selected account as primary
    const bankAccount = await BankAccount.findByIdAndUpdate(
      id,
      { isPrimary: true },
      { new: true }
    );

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.json({
      message: 'Primary bank account updated successfully',
      bankAccount
    });
  } catch (error) {
    console.error('Set primary bank account error:', error);
    res.status(500).json({ error: 'Error setting primary bank account' });
  }
};

// Generate UPI QR Code
const generateUPIQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    const bankAccount = await BankAccount.findById(id);

    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    if (!bankAccount.upiId) {
      return res.status(400).json({ error: 'UPI ID not configured for this account' });
    }

    // Get amount from query params (optional)
    const { amount, note } = req.query;

    // Create UPI payment URL
    let upiUrl = `upi://pay?pa=${bankAccount.upiId}&pn=${encodeURIComponent(bankAccount.accountHolderName)}`;
    
    if (amount) {
      upiUrl += `&am=${amount}`;
    }
    
    if (note) {
      upiUrl += `&cu=${note}`;
    }

    // Add transaction reference (unique each time)
    const txnRef = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    upiUrl += `&tr=${txnRef}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    res.json({
      qrCode: qrCodeDataUrl,
      upiUrl,
      txnRef,
      upiId: bankAccount.upiId,
      accountHolderName: bankAccount.accountHolderName
    });
  } catch (error) {
    console.error('Generate UPI QR Code error:', error);
    res.status(500).json({ error: 'Error generating QR code' });
  }
};

// Get bank account statistics (Super Admin only)
const getBankAccountStats = async (req, res) => {
  try {
    const totalAccounts = await BankAccount.countDocuments();
    const activeAccounts = await BankAccount.countDocuments({ isActive: true });
    const inactiveAccounts = await BankAccount.countDocuments({ isActive: false });
    const primaryAccount = await BankAccount.findOne({ isPrimary: true });

    res.json({
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      primaryAccount: primaryAccount ? {
        _id: primaryAccount._id,
        accountHolderName: primaryAccount.accountHolderName,
        bankName: primaryAccount.bankName,
        accountNumber: primaryAccount.accountNumber
      } : null
    });
  } catch (error) {
    console.error('Get bank account stats error:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
};

module.exports = {
  getAllBankAccounts,
  getActiveBankAccounts,
  addBankAccount,
  updateBankAccount,
  toggleBankAccountStatus,
  deleteBankAccount,
  setPrimaryBankAccount,
  generateUPIQRCode,
  getBankAccountStats
};
