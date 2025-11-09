#!/usr/bin/env node

/**
 * Mobile Development Setup Script
 * Automatically configures HTTPS development server for mobile testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

function checkMkcert() {
  try {
    execSync('mkcert --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function installMkcert() {
  console.log('📦 Installing mkcert for local HTTPS certificates...');
  
  try {
    if (process.platform === 'win32') {
      console.log('Please install mkcert manually:');
      console.log('1. Download from: https://github.com/FiloSottile/mkcert/releases');
      console.log('2. Or use: choco install mkcert (if you have Chocolatey)');
      console.log('3. Or use: scoop install mkcert (if you have Scoop)');
    } else if (process.platform === 'darwin') {
      execSync('brew install mkcert', { stdio: 'inherit' });
    } else {
      console.log('Please install mkcert manually for your Linux distribution');
      console.log('Visit: https://github.com/FiloSottile/mkcert#installation');
    }
  } catch (error) {
    console.error('❌ Failed to install mkcert automatically');
    console.log('Please install mkcert manually and run this script again');
    process.exit(1);
  }
}

function setupCertificates() {
  const localIP = getLocalIP();
  
  console.log('🔐 Setting up local HTTPS certificates...');
  
  try {
    // Install local CA
    execSync('mkcert -install', { stdio: 'inherit' });
    
    // Generate certificates
    execSync(`mkcert localhost 127.0.0.1 ::1 ${localIP}`, { stdio: 'inherit' });
    
    console.log('✅ Certificates generated successfully!');
    console.log(`📱 Your mobile access URL: https://${localIP}:3000`);
    
    return { localIP, certFiles: ['localhost+3.pem', 'localhost+3-key.pem'] };
    
  } catch (error) {
    console.error('❌ Failed to generate certificates:', error.message);
    return null;
  }
}

function createHTTPSServer(certInfo) {
  const serverContent = `
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Try to find certificate files
let httpsOptions;
try {
  const certFile = fs.existsSync('./localhost+3.pem') ? './localhost+3.pem' : './cert.pem';
  const keyFile = fs.existsSync('./localhost+3-key.pem') ? './localhost+3-key.pem' :r };rveTPSSeeateHTcrtes, caupCertifiLocalIP, set { getts =orle.exp
moduain();
}
e) {
  m === modulquire.mainif (re
;
}
structions')led inetai d.md forNG_READYSTIMOBILE_TE\n💡 See .log('soles');
  conmissionophone perera/micram'4. Test cole.log(onsning');
  curity warpt the seccce'3. Aconsole.log(`);
  ce\eviour mobile d yon00 P}:30nfo.localI://\${certI https2. Openlog(\`sole.e');
  conun dev:mobilpm rRun: nlog('1. le.;
  consops:')ext ste('\n📱 Ne.logconsol;
  plete!')p comment setubile develop('\n🎉 Moole.logns 
  cogGuide();
 ileTestin createMobg guide
 stintee // Creat  ();
  
ckageJsonupdatePa  
package.json/ Update  /);
  
 ertInfor(cTPSServeHTte creaer
  servte HTTPS 
  // Crea
  }
 t(1);ess.exiocd');
    prsetup failete ❌ Certificae.log('ol
    cons {tInfo)  if (!cer;
  
ficates()tupCertinfo = seconst certIficates
   certi/ Setup
  /  }
  );
    }
it(1  process.ex
    gain');cript ahis sd run tl mkcert anal instg('Pleasesole.lo    con()) {
  kMkcert if (!chec  
   );
  stallMkcert(;
    inound')kcert not f m'❌onsole.log({
    c)) ckMkcert(  if (!chealled
 instrt iscek if mk
  // Chec
  ...\n');ironmentopment env develup mobileg tin('🚀 Setole.log() {
  consion mainfunct;
}

EADY.md')_RSTINGE_TEOBILe created: M guidtinge tes'✅ Mobilonsole.log(nt);
  cideConte.md', guDYTESTING_REAMOBILE_nc('riteFileSy`;

  fs.w\! 🎉
stingbile te moappys work

Hideo controlio/v] Audrks
- [ ging wo messa- [ ] Chatlly
successfuconnects all  Video c ]- [s  
work permission rophone [ ] Mic
- worksrmissionCamera pe[ ] obile
- on msite s the acces] Can 
- [ g Checklist## 📋 Testin)}

tLocalIP(geess: ${P addrct Icorre✅ Using the ort 3000
- n p onsnnectiol allows corewalork
- ✅ Fii netwWiFame s on sviceBoth deile
- ✅ obcess from M Ac
### Can't camera
ng the is usianother appeck if ted
- ✅ Chomp when pr permissions- ✅ GrantTTP)
S (not Hg HTTPe usinsure you'r
- ✅ Make ngorki Not W/Microphonemera Ca###icates

rtifvelopment cer local del foormas n3. This imilar
r si" o (unsafe)calhosto lod tceeClick "Pro"
2. s Detail"Showor nced" ck "AdvaCliarning
1. rity Wecu Shows Sserle Brow

### Mobiootinglesh
## 🔧 Troub\\`
ttp 3000\ngrok hely: \\\`eparatk sn use ngro\\`
The\`\\\`\v
\\ deunsh
npm r`ba\\`\\\\\`\lopment
\lar Deveeguption 3: Rk

### Oby ngroded URL proviPS  HTT`
Use the\\\\`\
\\\`\dev:ngrokrun m 
np\\`bash\\\\`\`\\
nelgrok Tunption 2: n
### O device
 your mobile000** on:3lIP()}tLocahttps://${gesit: **en vi`\\\`
Th\\\\`\:mobile
\evm run d\\`bash
np\`\\\`\\
\ecommended) HTTPS (Rn 1: Localio# Opt

##eady! up is Rur Set
## Yock Start
Testing Qui 📱 Mobile \`#eContent = st guid con() {
 ingGuidesteateMobileTenction cr);
}

fuent scripts'pmobile develoed with m updatjson'✅ Package.sole.log( 2));
  conon, null,ckageJsify(patringN.s, JSOeJsonPathync(packagwriteFileS 
  fs.tp 3000';
  ngrok htun dev &'npm rok'] = ev:ngrs['dJson.script  packagetps.js';
er-hterv] = 'node sle'['dev:mobiptsscriJson.ackagejs';
  pv.deetup-mobile-e scripts/s'nodbile'] = s['setup:moiptscrkageJson.;
  paccripts || {}son.ss = packageJcriptckageJson.ss
  paiptelopment scr devbiledd mo  // A;
  
th, 'utf8'))sonPaackageJleSync(p.readFiSON.parse(fs = J packageJson  
  constn;
  }
    retur found');
 note.jsonackagerror('❌ ple. conso  Path)) {
 kageJsonsSync(pac!fs.exist
  
  if (son';'package.jnPath = ageJsopacknst   co() {
onackageJsdatePfunction up
}

s.js');ttpr-hd: serveerver create HTTPS sg('✅.lo
  consolerContent);.js', serveerver-httpsc('sleSynriteFifs.w;

  ;
`;
})
  }));ole.log(''   cons;
 on HTTPS')will work hone ropCamera/micog('   •    console.l');
 g on mobilety warnin the securiptd to acceou may nee'   • Ynsole.log(   co
  network');he same WiFihone is on tur pake sure yo M.log('   •   consoles:');
 iple.log('💡 T
    consolog('');   console.);
 \`alIP}:3000://\${lock:  https\`   Networole.log();
    cons:3000\`//localhost   https:l: ocaog(\`   Lole.l);
    consURLs:'bile Access Moog('📱 .l    consolee.log('');
nsol
    co);!'dyr ReaServet lopmenS Deve HTTPg('🚀  console.lo';
    
  IP'}CAL_ 'YOUR_LOlIP ||locacertInfo?.IP = '${alonst loc 
    cow err;
    (err) thr=> {
    if) err, ( '0.0.0.0'ten(3000,.lis
  })l);rsedUrreq, res, pale(  hande);
  req.url, trurl = parse(nst parsedU    co res) => {
tions, (req,sOpeServer(http
  creat) => {).then((prepare(
app.;
}
cess.exit(1)proe');
  obilun setup:mn: npm r Please rus not found.cate fileifior('❌ Certle.errconsoor) {
  atch (err
} cile),
  };Sync(certFfs.readFile  cert: 
  File),c(keyreadFileSyny: fs. = {
    keptionssOhttp
  em';
   './key.p