const erp = require('../services/erp.service');

function mapContact(c) {
  return {
    id: c['Contact ID'],
    name: c['Name'],
    phone: c['Phone Number'],
    email: c['Email ID'],
    department: c['Department'],
  };
}

exports.list = async (req, res) => {
  try {
    const unc = req.user.unc;
    if (!unc) return res.status(400).json({ success: false, message: 'User UNC not set' });
    const contacts = await erp.getContacts(unc);
    res.json({ success: true, data: contacts.map(mapContact) });
  } catch (err) {
    console.error('[contact.list]', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
};

exports.add = async (req, res) => {
  try {
    const { name, phone, email, department } = req.body;
    await erp.addContact(req.user.unc, { name, phone, email, department });
    res.json({ success: true, message: 'Contact added' });
  } catch (err) {
    console.error('[contact.add]', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to add contact' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id, name, phone, email, department } = req.body;
    await erp.updateContact(req.user.unc, { contactId: id, name, phone, email, department });
    res.json({ success: true, message: 'Contact updated' });
  } catch (err) {
    console.error('[contact.update]', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
};

exports.remove = async (req, res) => {
  try {
    await erp.deleteContact(req.user.unc, req.params.id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    console.error('[contact.remove]', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
};

exports.setDefault = async (req, res) => {
  try {
    const { id } = req.body;
    await erp.setDefaultContact(req.user.unc, id);
    res.json({ success: true, message: 'Default contact set' });
  } catch (err) {
    console.error('[contact.setDefault]', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to set default contact' });
  }
};
