/**
 * Email sending utilities for verification codes
 * 
 * For production, use Cloudflare Email Workers or external email service
 * Current implementation provides console logging for development
 */

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

/**
 * Send verification code email
 * In development: logs to console
 * In production: use Cloudflare Email Workers or external service (SendGrid, Mailgun, etc.)
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  env?: any
): Promise<boolean> {
  const subject = '[Brain Dump] 이메일 인증 코드'
  const text = `
    안녕하세요!
    
    Brain Dump 회원가입을 위한 인증 코드입니다.
    
    인증 코드: ${code}
    
    이 코드는 10분간 유효합니다.
    본인이 요청하지 않았다면 이 메일을 무시하세요.
    
    감사합니다.
    Brain Dump 팀
  `
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 Brain Dump</h1>
          <p>이메일 인증 코드</p>
        </div>
        <div class="content">
          <p>안녕하세요!</p>
          <p>Brain Dump 회원가입을 위한 인증 코드입니다.</p>
          
          <div class="code-box">
            <p style="margin: 0 0 10px 0; color: #666;">인증 코드</p>
            <div class="code">${code}</div>
          </div>
          
          <p><strong>이 코드는 10분간 유효합니다.</strong></p>
          <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
          
          <div class="footer">
            <p>© 2026 Brain Dump. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  // Development: Log to console
  if (!env || !env.EMAIL_SERVICE_ENABLED) {
    console.log('='.repeat(60))
    console.log('📧 EMAIL VERIFICATION CODE (Development Mode)')
    console.log('='.repeat(60))
    console.log(`To: ${email}`)
    console.log(`Code: ${code}`)
    console.log(`Subject: ${subject}`)
    console.log('='.repeat(60))
    return true
  }

  // Production: Use Cloudflare Email Workers or external service
  try {
    // Option 1: Cloudflare Email Workers (if configured)
    if (env.EMAIL_WORKER_URL) {
      const response = await fetch(env.EMAIL_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject,
          text,
          html
        })
      })
      
      if (!response.ok) {
        throw new Error(`Email worker failed: ${response.statusText}`)
      }
      
      return true
    }

    // Option 2: SendGrid (if configured)
    if (env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: env.FROM_EMAIL || 'noreply@braindump.app' },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`SendGrid API failed: ${response.statusText}`)
      }

      return true
    }

    // Option 3: Mailgun (if configured)
    if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
      const formData = new FormData()
      formData.append('from', env.FROM_EMAIL || 'noreply@braindump.app')
      formData.append('to', email)
      formData.append('subject', subject)
      formData.append('text', text)
      formData.append('html', html)

      const response = await fetch(
        `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
          },
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`Mailgun API failed: ${response.statusText}`)
      }

      return true
    }

    // No email service configured
    console.warn('⚠️ No email service configured. Email not sent.')
    console.log(`Email to ${email} with code: ${code}`)
    return false

  } catch (error) {
    console.error('Email sending error:', error)
    // In production, log to monitoring service
    return false
  }
}

/**
 * Send password reset email (for future use)
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string,
  env?: any
): Promise<boolean> {
  const subject = '[Brain Dump] 비밀번호 재설정'
  const text = `
    비밀번호 재설정 요청이 있었습니다.
    
    아래 링크를 클릭하여 비밀번호를 재설정하세요:
    ${resetUrl}
    
    이 링크는 1시간 동안 유효합니다.
    본인이 요청하지 않았다면 이 메일을 무시하세요.
  `

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 Brain Dump</h1>
          <p>비밀번호 재설정</p>
        </div>
        <div class="content">
          <p>비밀번호 재설정 요청이 있었습니다.</p>
          <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">비밀번호 재설정</a>
          </div>
          
          <p style="font-size: 12px; color: #666;">
            버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            ${resetUrl}
          </p>
          
          <p><strong>이 링크는 1시간 동안 유효합니다.</strong></p>
          <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
          
          <div class="footer">
            <p>© 2026 Brain Dump. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  // Use same email sending logic as verification email
  if (!env || !env.EMAIL_SERVICE_ENABLED) {
    console.log('='.repeat(60))
    console.log('📧 PASSWORD RESET EMAIL (Development Mode)')
    console.log('='.repeat(60))
    console.log(`To: ${email}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log('='.repeat(60))
    return true
  }

  // Production email sending logic...
  // (Similar to sendVerificationEmail)
  
  return false
}
