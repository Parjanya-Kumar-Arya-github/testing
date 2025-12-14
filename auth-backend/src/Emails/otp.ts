export const htmlEmail = (otp) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>BSW IIT Delhi – OTP Verification</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:24px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background-color:#102C3A; padding:20px 24px;">
                  <h2 style="margin:0; color:#ffffff; font-size:20px; font-weight:600;">
                    Board for Student Welfare
                  </h2>
                  <p style="margin:4px 0 0; color:#dbe6ec; font-size:14px;">
                    Indian Institute of Technology Delhi
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 24px; color:#1f2933;">
                  <p style="font-size:15px; margin:0 0 16px;">
                    Dear User,
                  </p>

                  <p style="font-size:15px; line-height:1.6; margin:0 0 20px;">
                    We received a request to verify your email address for accessing
                    the <strong>BSW, IIT Delhi</strong> portal.
                  </p>

                  <p style="font-size:15px; margin:0 0 12px;">
                    Please use the following One-Time Password (OTP):
                  </p>

                  <!-- OTP Box -->
                  <div style="margin:20px 0; text-align:center;">
                    <span style="
                      display:inline-block;
                      padding:14px 28px;
                      font-size:26px;
                      letter-spacing:6px;
                      font-weight:600;
                      color:#102C3A;
                      background-color:#f0f4f7;
                      border-radius:6px;
                    ">
                      ${otp}
                    </span>
                  </div>

                  <p style="font-size:14px; color:#4b5563; margin:0 0 20px;">
                    This OTP is valid for <strong>10 minutes</strong>.  
                    Please do not share this code with anyone.
                  </p>

                  <p style="font-size:14px; color:#4b5563; margin:0;">
                    If you did not initiate this request, you may safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 24px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
                  <p style="margin:0; font-size:13px; color:#6b7280; line-height:1.5;">
                    Regards,<br />
                    <strong>Board for Student Welfare</strong><br />
                    Indian Institute of Technology Delhi
                  </p>

                  <p style="margin:12px 0 0; font-size:12px; color:#9ca3af;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
