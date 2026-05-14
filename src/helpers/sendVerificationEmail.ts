import { render } from '@react-email/render';
import VerificationEmail from '../../emails/VerificationEmail';
import { ApiResponse } from '@/types/ApiResponse';
import { createGmailTransport } from '@/lib/mail';

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  const transporter = createGmailTransport();
  if (!transporter) {
    console.error(
      'Gmail SMTP is not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in .env'
    );
    return { success: false, message: 'Email service is not configured.' };
  }

  const fromUser = process.env.GMAIL_USER!;

  try {
    const html = await render(
      VerificationEmail({ username, otp: verifyCode })
    );

    await transporter.sendMail({
      from: `"Mystery Message" <${fromUser}>`,
      to: email,
      subject: 'Mystery Message Verification Code',
      html,
    });
    return { success: true, message: 'Verification email sent successfully.' };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Failed to send verification email.' };
  }
}
