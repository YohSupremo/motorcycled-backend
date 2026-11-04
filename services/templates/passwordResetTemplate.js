export const createPasswordResetTemplate = ({ customerName, resetUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
    <tr>
      <td style="background-color: #ffffff; padding: 24px 32px; border-bottom: 1px solid #e4e4e7;">
        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align: middle;">
              <div style="font-size: 18px; font-weight: 800; color: #047857; letter-spacing: 1.2px; text-transform: uppercase;">MOTORCYCLED</div>
              <div style="font-size: 10px; font-weight: 600; color: #71717a; letter-spacing: 0.6px; margin-top: 2px;">PASSWORD RESET</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 28px 32px;">
        <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #18181b; letter-spacing: -0.3px;">Reset your password</h1>
        <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.7; color: #52525b;">Hi ${customerName},</p>
        <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.7; color: #52525b;">We received a request to reset the password for your Motorcycled account. Tap the button below to create a new password. This link will expire in <strong>15 minutes</strong>.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center" style="border-radius: 6px; background-color: #047857;">
              <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; letter-spacing: 0.3px; text-transform: uppercase;">Reset Password</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.7; color: #71717a;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.6; word-break: break-all;"><a href="${resetUrl}" style="color: #047857; text-decoration: none;">${resetUrl}</a></p>
        <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #71717a;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 18px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #a1a1aa;">© ${new Date().getFullYear()} MotorCycled Dealership. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
