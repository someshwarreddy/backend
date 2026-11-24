const transporter = require('../config/email');

const sendActivationEmail = async ({
  to,
  name,
  activationUrl
}) => {
  const info = await transporter.sendMail({
    from: '"Enterprise Dashboard" <no-reply@enterprise-dashboard.test>',
    to,
    subject: 'Activate your Enterprise Dashboard account',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your account has been created successfully.</p>
      <p>Click below to activate your account and set your password.</p>
      <a href="${activationUrl}">Activate Account</a>
      <p>This link expires in 24 hours.</p>
    `
  });

  console.log('Activation email preview:', 
    require('nodemailer').getTestMessageUrl(info)
  );

  return info;
};

module.exports = { sendActivationEmail };