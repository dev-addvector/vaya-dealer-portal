const erp = require('../services/erp.service');

const parseFlag = (val) => val === true || String(val).toLowerCase() === 'true' ? 1 : 0;

function mapAddress(addr) {
  return {
    id: addr['Address ID'],
    line1: addr['Address'],
    city: addr['City']?.trim(),
    state: addr['State']?.trim(),
    country: addr['Country']?.trim(),
    pincode: addr['PinCode'],
    addressType: addr['Address Type'],
    isDefault: parseFlag(addr['Shipping Flag']),
    isBillingDefault: parseFlag(addr['Billing Flag']),
    label: addr['Address'],
  };
}

exports.list = async (req, res) => {
  try {
    const unc = req.user.unc;
    if (!unc) return res.status(400).json({ success: false, message: 'User UNC not set' });
    const addresses = await erp.getAddresses(unc);
    res.json({ success: true, data: addresses.map(mapAddress) });
  } catch (err) {
    console.error('[address.list]', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
};

exports.add = async (req, res) => {
  try {
    const { line1, city, state, country, pincode } = req.body;
    await erp.addAddress(req.user.unc, { address: line1, city, state, country, pincode });
    res.json({ success: true, message: 'Address added' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id, line1, city, state, country, pincode } = req.body;
    await erp.updateAddress(req.user.unc, { addressId: id, address: line1, city, state, country, pincode });
    res.json({ success: true, message: 'Address updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};

exports.remove = async (req, res) => {
  try {
    await erp.deleteAddress(req.user.unc, req.params.id);
    res.json({ success: true, message: 'Address deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
};

exports.setDefault = async (req, res) => {
  try {
    const { id } = req.body;
    await erp.setDefaultAddress(req.user.unc, id);
    res.json({ success: true, message: 'Default address set' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to set default address' });
  }
};
