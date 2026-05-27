const express = require('express');
const twilio = require('twilio');
const app = express();
app.use(express.urlencoded({ extended: false }));

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const TWILIO_WHATSAPP = 'whatsapp:+14155238886';
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const AGENTS = [
  { name: 'Priyanka', number: 'whatsapp:+916299105078' },
  { name: 'Soniya',   number: 'whatsapp:+919556047883' },
  { name: 'Tanishka', number: 'whatsapp:+917014008978' },
  { name: 'Priyanshu',number: 'whatsapp:+919977033292' },
  { name: 'Mukund',   number: 'whatsapp:+918826117182' },
  { name: 'Prince',   number: 'whatsapp:+919630513716' },
];

const sessions = {};

app.post('/webhook', async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body ? req.body.Body.trim() : '';
  if (!sessions[from]) { sessions[from] = { step: 'get_language' }; }
  const session = sessions[from];
  let reply = '';

  if (session.step === 'get_language') {
    reply = 'Thanks for contacting Xencreates!\n\nPlease select your preferred language:\n1. English\n2. Hindi';
    session.step = 'get_name';
  } else if (session.step === 'get_name') {
    if (body === '1') { session.lang = 'en'; reply = 'Please share your name.'; }
    else { session.lang = 'hi'; reply = 'Kripya apna naam batayein.'; }
    session.step = 'get_service';
  } else if (session.step === 'get_service') {
    session.name = body;
    if (session.lang === 'en') {
      reply = 'Thank you ' + session.name + '!\n\nHow can we help you?\n\n1. Video Production\n2. Social Media Management\n3. Graphics / Motion Design\n4. Website Development\n5. Meta Ads\n6. Other';
    } else {
      reply = 'Shukriya ' + session.name + '!\n\nHum aapki kya madad kar sakte hain?\n\n1. Video Production\n2. Social Media Management\n3. Graphics / Motion Design\n4. Website Development\n5. Meta Ads\n6. Kuch aur';
    }
    session.step = 'connecting';
  } else if (session.step === 'connecting') {
    const services = {'1':'Video Production','2':'Social Media Management','3':'Graphics / Motion Design','4':'Website Development','5':'Meta Ads','6': session.lang === 'en' ? 'Other' : 'Kuch aur'};
    session.service = services[body] || body;
    reply = session.lang === 'en' ? 'Thank you! Please hold on, connecting you to our team.' : 'Shukriya! Ek second, aapko hamare team se connect kar rahe hain.';
    session.step = 'done';
    sendTwimlReply(res, reply);
    await notifyAgent(session, from);
    return;
  } else {
    reply = session.lang === 'en' ? 'Our team will get back to you shortly.' : 'Hamari team jald aapse sampark karegi.';
  }
  sendTwimlReply(res, reply);
});

async function notifyAgent(session, customerNumber) {
  const customerClean = customerNumber.replace('whatsapp:', '');
  for (const agent of AGENTS) {
    try {
      await client.messages.create({
        from: TWILIO_WHATSAPP,
        to: agent.number,
        body: 'New Client - Xencreates\n\nName: ' + session.name + '\nNumber: ' + customerClean + '\nService: ' + session.service + '\n\nPlease respond or call them directly.'
      });
      console.log('Notified: ' + agent.name);
      break;
    } catch (err) { console.log('Failed: ' + agent.name); }
  }
}

function sendTwimlReply(res, message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  res.type('text/xml');
  res.send(twiml.toString());
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log('Xencreates Bot running on port ' + PORT); });
