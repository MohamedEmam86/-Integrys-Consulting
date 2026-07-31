// Integrys Consulting — form handler
// Sends the enquiry to the company inbox AND an automated acknowledgement
// to the person who submitted the form.
//
// Required Vercel environment variables:
//   SMTP_HOST   e.g. smtp.hostinger.com
//   SMTP_PORT   465 (SSL) or 587 (TLS)
//   SMTP_USER   info@integrysconsult.com
//   SMTP_PASS   the mailbox password
//   TO_EMAIL    (optional) defaults to info@integrysconsult.com

const nodemailer = require('nodemailer');

const COMPANY = 'Integrys Consulting';
const SITE = 'https://integrysconsult.com';

const FORM_META = {
  booking: {
    subject: 'Discovery Call Request',
    ackSubjectEn: 'We received your discovery call request — Integrys Consulting',
    ackSubjectAr: 'استلمنا طلب مكالمة الاستكشاف — إنتيجريس للاستشارات',
    ackLineEn: 'Thank you for requesting a discovery call with Integrys Consulting.',
    ackLineAr: 'شكراً لطلبك مكالمة استكشافية مع إنتيجريس للاستشارات.',
    nextEn: [
      'A senior practitioner will review your request personally — not an assistant.',
      'We will confirm your preferred slot, or propose the closest available one, within one business day.',
      'The call runs about 30 minutes. No obligation and no sales pitch.',
      'If it helps, have any regulatory correspondence or deadlines to hand.'
    ],
    nextAr: [
      'سيقوم أحد كبار الممارسين بمراجعة طلبك شخصياً.',
      'سنؤكد الموعد المفضل لديك أو نقترح أقرب موعد متاح خلال يوم عمل واحد.',
      'تستغرق المكالمة حوالي 30 دقيقة — بدون التزام أو عروض ترويجية.',
      'يفيد أن تكون أي مراسلات أو مواعيد رقابية في متناول يدك.'
    ]
  },
  expert: {
    subject: 'Talk to an Expert',
    ackSubjectEn: 'We received your enquiry — Integrys Consulting',
    ackSubjectAr: 'استلمنا استفسارك — إنتيجريس للاستشارات',
    ackLineEn: 'Thank you for contacting Integrys Consulting.',
    ackLineAr: 'شكراً لتواصلك مع إنتيجريس للاستشارات.',
    nextEn: [
      'Your enquiry has been routed to the practitioner who covers this area.',
      'We respond within one business day, and sooner where a regulatory deadline is involved.',
      'If your matter is urgent, call or WhatsApp +20 10 9798 8812.',
      'Anything you share with us is treated as confidential.'
    ],
    nextAr: [
      'تم توجيه استفسارك إلى الممارس المختص بهذا المجال.',
      'نرد خلال يوم عمل واحد، وأسرع إذا كان هناك موعد رقابي نهائي.',
      'إذا كان الأمر عاجلاً، اتصل أو راسلنا على واتساب +20 10 9798 8812.',
      'كل ما تشاركه معنا يُعامل بسرية تامة.'
    ]
  },
  demo: {
    subject: 'ComplyNex Demo Request',
    ackSubjectEn: 'We received your ComplyNex demo request — Integrys Consulting',
    ackSubjectAr: 'استلمنا طلب عرض كومبلاي‑نكس — إنتيجريس للاستشارات',
    ackLineEn: 'Thank you for requesting a ComplyNex demonstration.',
    ackLineAr: 'شكراً لطلبك عرضاً توضيحياً لمنصة كومبلاي‑نكس.',
    nextEn: [
      'We will contact you within one business day to agree a time.',
      'The demo runs about 45 minutes on a live environment — not slides.',
      'Tell us which modules matter most and we will focus the session there.',
      'We can also walk through on-premise deployment and data residency if that is a requirement.'
    ],
    nextAr: [
      'سنتواصل معك خلال يوم عمل واحد للاتفاق على موعد.',
      'يستغرق العرض حوالي 45 دقيقة على بيئة حية — وليس شرائح عرض.',
      'أخبرنا بالوحدات الأهم لديك وسنركز الجلسة عليها.',
      'يمكننا أيضاً استعراض التركيب الداخلي على خوادمكم ومتطلبات سيادة البيانات.'
    ]
  },
  proposal: {
    subject: 'Proposal Request',
    ackSubjectEn: 'We received your proposal request — Integrys Consulting',
    ackSubjectAr: 'استلمنا طلب عرض السعر — إنتيجريس للاستشارات',
    ackLineEn: 'Thank you for requesting a proposal from Integrys Consulting.',
    ackLineAr: 'شكراً لطلبك عرضاً من إنتيجريس للاستشارات.',
    nextEn: [
      'We review the scope you described and confirm we have understood it correctly.',
      'If anything is unclear we will come back with a short set of questions first.',
      'You will receive a written proposal with defined deliverables, timeline and fees within two to three business days.',
      'The proposal separates what is a regulatory requirement from what is optional best practice.'
    ],
    nextAr: [
      'نراجع النطاق الذي وصفته ونؤكد فهمنا له بشكل صحيح.',
      'إذا كان هناك أي غموض سنعود إليك بعدد قليل من الأسئلة أولاً.',
      'ستستلم عرضاً مكتوباً بمخرجات وجدول زمني وأتعاب محددة خلال يومين إلى ثلاثة أيام عمل.',
      'يفصل العرض بين ما هو مطلب رقابي وما هو ممارسة فضلى اختيارية.'
    ]
  }
};

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LABELS = {
  name: 'Name', email: 'Email', company: 'Company', phone: 'Phone / WhatsApp',
  service: 'Service of interest', preferred_date: 'Preferred date',
  preferred_time: 'Preferred time (Cairo)', role: 'Role', urgency: 'Urgency',
  budget: 'Indicative budget', timeline: 'Required timeline', modules: 'Modules of interest', entity: 'Organisation type',
  regulator: 'Regulator / framework', message: 'Message'
};

function internalHtml(type, d) {
  const meta = FORM_META[type] || FORM_META.expert;
  const rows = Object.keys(d)
    .filter(k => !k.startsWith('_') && k !== 'lang' && k !== 'formType' && d[k])
    .map(k => `<tr>
        <td style="padding:8px 14px;background:#f3f7fa;border:1px solid #dce5ee;font:600 13px Arial;color:#0D2B4E;white-space:nowrap">${esc(LABELS[k] || k)}</td>
        <td style="padding:8px 14px;border:1px solid #dce5ee;font:13px Arial;color:#26384c">${esc(d[k]).replace(/\n/g, '<br>')}</td>
      </tr>`).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:640px">
    <div style="background:#0D2B4E;padding:18px 22px;border-radius:10px 10px 0 0">
      <div style="color:#00A896;font:700 11px Arial;letter-spacing:2px">NEW WEBSITE ENQUIRY</div>
      <div style="color:#fff;font:700 21px Arial;margin-top:4px">${esc(meta.subject)}</div>
    </div>
    <table style="border-collapse:collapse;width:100%;margin-top:0">${rows}</table>
    <p style="font:12px Arial;color:#7b93a9;margin-top:14px">
      Submitted ${new Date().toUTCString()} via ${SITE}
    </p>
  </div>`;
}

function ackHtml(type, name, isAr) {
  const meta = FORM_META[type] || FORM_META.expert;
  const steps = (isAr ? meta.nextAr : meta.nextEn)
    .map(s => `<li style="margin-bottom:9px;line-height:1.65">${esc(s)}</li>`).join('');
  const dir = isAr ? 'rtl' : 'ltr';
  const align = isAr ? 'right' : 'left';
  const hello = isAr ? `مرحباً ${esc(name)}،` : `Hello ${esc(name)},`;
  const whatNext = isAr ? 'ما الخطوة التالية' : 'What happens next';
  const sign = isAr ? 'مع أطيب التحيات،<br>فريق إنتيجريس للاستشارات' : 'Kind regards,<br>The Integrys Consulting team';
  const tagline = isAr ? 'حيث تلتقي الحوكمة والنمو' : 'Where Governance Meets Growth';
  const noreply = isAr
    ? 'هذه رسالة تأكيد تلقائية. يمكنك الرد على هذه الرسالة مباشرة للوصول إلينا.'
    : 'This is an automated acknowledgement. You can reply directly to this email to reach us.';

  return `<div dir="${dir}" style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;text-align:${align}">
    <div style="background:#0D2B4E;padding:26px 26px 22px;border-radius:12px 12px 0 0">
      <div style="color:#00A896;font:700 11px Arial;letter-spacing:2.5px">${esc(COMPANY.toUpperCase())}</div>
      <div style="color:#ffffff;font:700 23px Arial;margin-top:6px">${esc(isAr ? meta.ackLineAr : meta.ackLineEn)}</div>
    </div>
    <div style="border:1px solid #dce5ee;border-top:none;border-radius:0 0 12px 12px;padding:24px 26px;background:#fff">
      <p style="font:15px Arial;color:#16283d;margin:0 0 14px">${hello}</p>
      <p style="font:14px Arial;color:#44607a;line-height:1.7;margin:0 0 20px">
        ${esc(isAr ? meta.ackLineAr : meta.ackLineEn)}
      </p>
      <div style="font:700 14px Arial;color:#0D2B4E;margin-bottom:10px">${whatNext}</div>
      <ul style="font:14px Arial;color:#44607a;padding-${isAr ? 'right' : 'left'}:20px;margin:0 0 22px">${steps}</ul>
      <div style="border-top:1px solid #e6edf4;padding-top:18px;font:14px Arial;color:#44607a;line-height:1.7">
        ${sign}
      </div>
      <div style="margin-top:16px;font:12.5px Arial;color:#7b93a9;line-height:1.7">
        info@integrysconsult.com &nbsp;·&nbsp; +20 10 9798 8812 &nbsp;·&nbsp;
        <a href="${SITE}" style="color:#00A896;text-decoration:none">integrysconsult.com</a><br>
        <span style="color:#00A896">${tagline}</span>
      </div>
      <p style="font:11.5px Arial;color:#9fb2c4;margin-top:18px">${noreply}</p>
    </div>
  </div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let d = req.body;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }
  d = d || {};

  if (d._gotcha) return res.status(200).json({ ok: true });       // silently drop bots

  const type = FORM_META[d.formType] ? d.formType : 'expert';
  const isAr = d.lang === 'ar';
  const name = (d.name || '').trim();
  const email = (d.email || '').trim();

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid name and email address.' });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('SMTP environment variables are not configured.');
    return res.status(500).json({ error: 'Email is not configured on the server yet.' });
  }

  const TO = process.env.TO_EMAIL || 'info@integrysconsult.com';
  const port = Number(SMTP_PORT || 465);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const meta = FORM_META[type];

  try {
    // 1) enquiry to the company inbox
    await transporter.sendMail({
      from: `"${COMPANY} Website" <${SMTP_USER}>`,
      to: TO,
      replyTo: `"${name}" <${email}>`,
      subject: `${meta.subject} — ${d.company || name}`,
      html: internalHtml(type, d)
    });

    // 2) automated acknowledgement to the enquirer
    await transporter.sendMail({
      from: `"${COMPANY}" <${SMTP_USER}>`,
      to: `"${name}" <${email}>`,
      replyTo: TO,
      subject: isAr ? meta.ackSubjectAr : meta.ackSubjectEn,
      html: ackHtml(type, name, isAr)
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mail send failed:', err && err.message);
    return res.status(502).json({ error: 'Could not send your message. Please email info@integrysconsult.com directly.' });
  }
};
