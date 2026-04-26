const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Auction Arena" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw - email failure shouldn't break the app flow
  }
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your Auction Arena account',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F97316, #FBBF24); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Auction Arena</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0F172A; margin-top: 0;">Welcome! 🎉</h2>
          <p style="color: #475569;">Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background: #F97316; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: 600;">
            Verify Email
          </a>
          <p style="color: #94A3B8; font-size: 13px;">If the button doesn't work, copy this link: ${verifyUrl}</p>
        </div>
      </div>
    `,
  });
};

// ── Auction Won — Email to BUYER with seller contact info ──
const sendAuctionWonEmailToBuyer = async (buyerEmail, details) => {
  const { productName, productDescription, productCategory, finalPrice, sellerName, sellerEmail, sellerPhone } = details;
  await sendEmail({
    to: buyerEmail,
    subject: `🎉 Congratulations! You won the auction for "${productName}"`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F97316, #FBBF24); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">🏆 You Won!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Auction Arena</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Congratulations! You've successfully won the auction. Here are the details of your winning bid:
          </p>

          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0F172A; margin: 0 0 12px; font-size: 18px;">${productName}</h3>
            <p style="color: #475569; font-size: 13px; margin: 0 0 8px; line-height: 1.5;">${productDescription || 'No description provided.'}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Category</td>
                <td style="padding: 6px 0; color: #0F172A; font-size: 14px; font-weight: 600; text-align: right;">${productCategory}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Winning Bid</td>
                <td style="padding: 6px 0; color: #16A34A; font-size: 18px; font-weight: 700; text-align: right;">₹${Number(finalPrice).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #0F172A; margin: 0 0 12px; font-size: 14px;">📞 Seller Contact Details</h4>
            <p style="color: #475569; font-size: 13px; margin: 4px 0;">Please reach out to the seller to arrange payment and delivery.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px;">Name</td>
                <td style="padding: 6px 0; color: #0F172A; font-size: 14px; font-weight: 500; text-align: right;">${sellerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px;">Email</td>
                <td style="padding: 6px 0; text-align: right;"><a href="mailto:${sellerEmail}" style="color: #F97316; font-size: 14px;">${sellerEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px;">Phone</td>
                <td style="padding: 6px 0; text-align: right;"><a href="tel:${sellerPhone}" style="color: #F97316; font-size: 14px;">${sellerPhone}</a></td>
              </tr>
            </table>
          </div>

          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; text-align: center;">
            Thank you for using Auction Arena. Happy collecting! 🎨
          </p>
        </div>
      </div>
    `,
  });
};

// ── Auction Sold — Email to SELLER with buyer contact info ──
const sendAuctionSoldEmailToSeller = async (sellerEmail, details) => {
  const { productName, productDescription, productCategory, finalPrice, buyerName, buyerEmail, buyerPhone } = details;
  await sendEmail({
    to: sellerEmail,
    subject: `🎉 Your item "${productName}" has been sold!`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #16A34A, #22C55E); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">💰 Item Sold!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Auction Arena</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Great news! Your auction has ended and your item has been sold. Here are the details:
          </p>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0F172A; margin: 0 0 12px; font-size: 18px;">${productName}</h3>
            <p style="color: #475569; font-size: 13px; margin: 0 0 8px; line-height: 1.5;">${productDescription || 'No description provided.'}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Category</td>
                <td style="padding: 6px 0; color: #0F172A; font-size: 14px; font-weight: 600; text-align: right;">${productCategory}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Sold For</td>
                <td style="padding: 6px 0; color: #16A34A; font-size: 18px; font-weight: 700; text-align: right;">₹${Number(finalPrice).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h4 style="color: #0F172A; margin: 0 0 12px; font-size: 14px;">📞 Buyer Contact Details</h4>
            <p style="color: #475569; font-size: 13px; margin: 4px 0;">Please reach out to the buyer to arrange payment and delivery.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px;">Name</td>
                <td style="padding: 6px 0; color: #0F172A; font-size: 14px; font-weight: 500; text-align: right;">${buyerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px;">Email</td>
                <td style="padding: 6px 0; text-align: right;"><a href="mailto:${buyerEmail}" style="color: #F97316; font-size: 14px;">${buyerEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; font-size: 12px;">Phone</td>
                <td style="padding: 6px 0; text-align: right;"><a href="tel:${buyerPhone}" style="color: #F97316; font-size: 14px;">${buyerPhone}</a></td>
              </tr>
            </table>
          </div>

          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; text-align: center;">
            Thank you for selling on Auction Arena. List more items today! 🚀
          </p>
        </div>
      </div>
    `,
  });
};

// ── Auction Ended with No Bids — Email to SELLER ──
const sendAuctionNoBidsEmail = async (sellerEmail, details) => {
  const { productName, productCategory } = details;
  await sendEmail({
    to: sellerEmail,
    subject: `Your auction for "${productName}" ended with no bids`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: #475569; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Auction Ended</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Auction Arena</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Unfortunately, your auction for <strong>${productName}</strong> (${productCategory}) ended without receiving any bids.
          </p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Consider re-listing the item with a lower starting price or a more detailed description to attract more bidders.
          </p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; text-align: center;">
            Auction Arena — Try listing again! 💪
          </p>
        </div>
      </div>
    `,
  });
};

const sendOutbidEmail = async (email, auctionDetails) => {
  await sendEmail({
    to: email,
    subject: 'You have been outbid!',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: #DC2626; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Outbid! 😱</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #475569;">Someone placed a higher bid on <strong>${auctionDetails.productName}</strong>.</p>
          <p style="color: #475569;">Current highest bid: <strong style="color: #DC2626;">₹${Number(auctionDetails.amount).toLocaleString('en-IN')}</strong></p>
          <p style="color: #475569;">Place a new bid before the auction ends!</p>
        </div>
      </div>
    `,
  });
};

const sendNewItemInCategoryEmail = async (email, productDetails) => {
  await sendEmail({
    to: email,
    subject: `New item in ${productDetails.category}!`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F97316, #FBBF24); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">New Item Alert! 🔔</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #475569;">A new item has been listed in your favorite category: <strong>${productDetails.category}</strong></p>
          <p style="color: #0F172A; font-size: 16px; font-weight: 600;">${productDetails.name}</p>
          <p style="color: #475569;">Starting at <strong style="color: #16A34A;">₹${Number(productDetails.basePrice).toLocaleString('en-IN')}</strong></p>
        </div>
      </div>
    `,
  });
};

// ── Welcome Email — sent on new user registration ──
const sendWelcomeEmail = async (email, userName) => {
  await sendEmail({
    to: email,
    subject: `Welcome to Auction Arena, ${userName}! 🎉`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #F97316, #FBBF24); padding: 40px 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Welcome to Auction Arena!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 15px;">India's Premier Live Auction Platform</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0F172A; margin-top: 0; font-size: 20px;">Hey ${userName}! 👋</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.7;">
            Thank you for joining <strong>Auction Arena</strong>! We're thrilled to have you on board.
            Whether you're here to discover rare collectibles, sell unique items, or compete in live bidding wars — you're in the right place.
          </p>

          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 10px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #0F172A; margin: 0 0 16px; font-size: 16px;">Here's what you can do:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; vertical-align: top; width: 30px; font-size: 18px;">🔍</td>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;"><strong>Explore Auctions</strong> — Browse hundreds of live auctions across categories</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; vertical-align: top; width: 30px; font-size: 18px;">💰</td>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;"><strong>Place Bids</strong> — Compete in real-time and win exclusive items</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; vertical-align: top; width: 30px; font-size: 18px;">📦</td>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;"><strong>Sell Items</strong> — List your products and start receiving bids instantly</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; vertical-align: top; width: 30px; font-size: 18px;">⭐</td>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;"><strong>Build Reputation</strong> — Earn ratings and become a trusted community member</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 14px 36px; background: #F97316; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Start Exploring →
            </a>
          </div>

          <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; text-align: center;">
            Need help? Simply reply to this email and our support team will assist you.
          </p>

          <div style="border-top: 1px solid #E2E8F0; margin-top: 24px; padding-top: 20px; text-align: center;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Auction Arena. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendAuctionWonEmailToBuyer,
  sendAuctionSoldEmailToSeller,
  sendAuctionNoBidsEmail,
  sendOutbidEmail,
  sendNewItemInCategoryEmail,
};
