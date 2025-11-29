# Harthio Crisis Detection System

**Purpose:** Identify and respond to users in crisis situations  
**Approach:** Keyword detection + severity levels + appropriate resources  
**Privacy:** All crisis events logged for admin review (not shared)

---

## Crisis Keywords (World Standard)

### **Category 1: Suicide & Self-Harm (CRITICAL)**
```javascript
const suicideKeywords = [
  // Direct statements
  'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all',
  'take my life', 'better off dead', 'want to die', 'wish I was dead',
  'no reason to live', 'can\'t live anymore', 'ready to die',
  
  // Goodbye messages
  'goodbye forever', 'final goodbye', 'last message', 'won\'t see you again',
  'this is the end', 'farewell', 'last time',
  
  // Methods
  'jump off', 'hang myself', 'slit my wrists', 'gun to my head',
  'drive off cliff', 'step in front of'
];

const selfHarmKeywords = [
  'self harm', 'self-harm', 'cut myself', 'cutting', 'hurt myself',
  'burn myself', 'harm myself', 'mutilate', 'self injury',
  'carve into skin', 'razor blade', 'cutting again'
];
```

### **Category 2: Substance Abuse Crisis (HIGH)**
```javascript
const substanceKeywords = [
  // Overdose
  'overdose', 'OD', 'too many pills', 'whole bottle',
  'take everything', 'end it with drugs', 'lethal dose',
  
  // Imminent relapse
  'using again', 'bought drugs', 'going to use', 'can\'t resist',
  'about to relapse', 'giving up sobriety', 'dealer called',
  'have the drugs', 'going to drink', 'bottle in hand',
  
  // Dangerous use
  'mixing drugs', 'don\'t care anymore', 'use until', 'binge'
];
```

### **Category 3: Violence (CRITICAL)**
```javascript
const violenceKeywords = [
  // Harm to others
  'hurt someone', 'kill someone', 'harm others', 'violent thoughts',
  'going to hurt', 'make them pay', 'revenge', 'get back at',
  
  // Specific threats
  'have a gun', 'have a weapon', 'going to shoot', 'going to stab',
  'hurt my family', 'hurt my partner', 'hurt my kids'
];
```

### **Category 4: Severe Mental Health (HIGH)**
```javascript
const mentalHealthKeywords = [
  // Psychosis
  'voices telling me', 'they\'re watching', 'not real',
  'hallucinating', 'losing my mind', 'going crazy',
  'people following me', 'conspiracy', 'they want to hurt me',
  
  // Severe panic
  'can\'t breathe', 'heart attack', 'dying right now', 'losing control',
  'panic attack', 'can\'t calm down', 'chest pain', 'going to pass out',
  
  // Dissociation
  'not in my body', 'watching myself', 'nothing feels real',
  'disconnected', 'floating away'
];
```

### **Category 5: Hopelessness (MODERATE)**
```javascript
const hopelessKeywords = [
  'no hope', 'hopeless', 'nothing matters', 'can\'t go on',
  'give up', 'no point', 'why bother', 'it\'s over',
  'failed at everything', 'worthless', 'burden to everyone',
  'everyone would be better off', 'can\'t take it anymore'
];
```

### **Category 6: Child Safety (CRITICAL)**
```javascript
const childSafetyKeywords = [
  'hurt my child', 'harm my baby', 'can\'t take care of',
  'better without me', 'child abuse', 'neglecting',
  'leaving them alone', 'unsafe for kids'
];
```

---

## Crisis Severity Levels

### **CRITICAL (Immediate Danger)**
**Triggers:** Suicide, overdose, violence, child safety  
**Response:**
1. Block normal AI chat
2. Show crisis resources ONLY
3. Log with HIGH priority
4. Admin review: Immediate

**UI Response:**
```
┌─────────────────────────────────────┐
│  🆘 We're Concerned About You       │
│                                     │
│  Please reach out for help now:    │
│                                     │
│  📞 988 Suicide & Crisis Lifeline   │
│      [Call Now]                     │
│                                     │
│  📱 Crisis Text Line                │
│      Text HOME to 741741            │
│      [Open Messages]                │
│                                     │
│  🚨 Emergency Services              │
│      Call 911                       │
│      [Call Now]                     │
│                                     │
│  🌐 International Resources         │
│      [Find Help in Your Country]    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [I'm Safe Now] [Talk to Someone]   │
└─────────────────────────────────────┘
```

### **HIGH (Serious Concern)**
**Triggers:** Self-harm, substance crisis, severe mental health  
**Response:**
1. Show crisis resources first
2. Limited AI support (coping techniques only)
3. Suggest emergency peer session
4. Log with MEDIUM priority
5. Admin review: Within 1 hour

**UI Response:**
```
┌─────────────────────────────────────┐
│  💙 You're Going Through Something  │
│     Difficult                       │
│                                     │
│  Crisis Resources:                  │
│  📞 988 Lifeline [Call]             │
│  📱 Text HOME to 741741 [Text]      │
│                                     │
│  Immediate Support:                 │
│  🎯 Join Emergency Session          │
│  💪 Quick Coping Technique          │
│  🧠 Grounding Exercise              │
│                                     │
│  [I Need Help] [I'm Managing]       │
└─────────────────────────────────────┘
```

### **MODERATE (Elevated Risk)**
**Triggers:** Hopelessness, panic, giving up  
**Response:**
1. Supportive AI conversation
2. Offer CBT tools
3. Suggest relevant sessions
4. Log with LOW priority
5. Admin review: Within 24 hours

**UI Response:**
```
Normal Harthio chat continues, but with:
- Extra empathy in responses
- Proactive session suggestions
- Check-in reminders
- Crisis resources in footer
```

---

## Crisis Response Flow

```javascript
async function handleUserMessage(message, userId) {
  // 1. Detect crisis
  const crisisDetection = await detectCrisis(message);
  
  if (crisisDetection.detected) {
    // 2. Log event
    await logCrisisEvent({
      userId,
      message,
      keywords: crisisDetection.keywords,
      severity: crisisDetection.severity,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    // 3. Respond based on severity
    switch (crisisDetection.severity) {
      case 'CRITICAL':
        return showCrisisResourcesOnly();
      
      case 'HIGH':
        return showCrisisResourcesWithSupport();
      
      case 'MODERATE':
        return continueWithExtraSupport();
    }
  }
  
  // 4. Normal AI response
  return await generateAIResponse(message, userId);
}
```

---

## Crisis Resources (International)

### **United States**
- 988 Suicide & Crisis Lifeline (24/7)
- Crisis Text Line: Text HOME to 741741
- SAMHSA National Helpline: 1-800-662-4357
- Veterans Crisis Line: 988, Press 1

### **International**
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/
- Befrienders Worldwide: https://www.befrienders.org/
- Find a Helpline: https://findahelpline.com/

### **Specific Countries**
- UK: 116 123 (Samaritans)
- Canada: 1-833-456-4566
- Australia: 13 11 14 (Lifeline)
- India: 91-22-27546669 (Aasra)
- South Africa: 0800 567 567 (SADAG)

---

## Admin Crisis Dashboard

### **Crisis Log Table**
```sql
CREATE TABLE crisis_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  message TEXT,
  detected_keywords TEXT[],
  severity TEXT, -- 'CRITICAL', 'HIGH', 'MODERATE'
  admin_reviewed BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES admin_roles(user_id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crisis_severity ON crisis_events(severity, admin_reviewed);
CREATE INDEX idx_crisis_user ON crisis_events(user_id, created_at);
```

### **Admin Dashboard View**
```
┌─────────────────────────────────────────────────┐
│  Crisis Events Dashboard                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔴 CRITICAL (2 unreviewed)                     │
│  ┌───────────────────────────────────────────┐ │
│  │ User: John D. (ID: abc123)                │ │
│  │ Time: 2 hours ago                         │ │
│  │ Keywords: suicide, end it all             │ │
│  │ Message: "I can't do this anymore..."     │ │
│  │ [Review] [Contact User] [Mark Safe]       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🟠 HIGH (5 unreviewed)                         │
│  🟡 MODERATE (12 unreviewed)                    │
│                                                 │
│  [View All] [Export Report] [Settings]          │
└─────────────────────────────────────────────────┘
```

---

## Age Verification for Addiction Features

### **Why Age Verification?**
- Legal compliance (COPPA, GDPR)
- Appropriate content for minors
- Parental consent for under 18
- Data for research & outcomes

### **Implementation**
```javascript
// On signup or first addiction feature access
const ageVerification = {
  dateOfBirth: 'YYYY-MM-DD',
  age: calculated,
  
  access: {
    generalMentalHealth: age >= 13, // With parental consent
    addictionRecovery: age >= 18,   // Adult only
    professionalTherapy: age >= 18  // Adult only (v0.4)
  }
};

// Feature gating
if (user.age < 18 && feature === 'addiction') {
  return {
    blocked: true,
    message: 'Addiction recovery features are for adults 18+. 
              You can still use general mental health support.',
    alternatives: ['General Support', 'Teen Mental Health', 'Crisis Resources']
  };
}
```

---

## Testing Crisis Detection

### **Test Cases**
```javascript
const testCases = [
  // Should trigger CRITICAL
  { input: "I'm going to kill myself tonight", expected: 'CRITICAL' },
  { input: "I have the pills, going to take them all", expected: 'CRITICAL' },
  
  // Should trigger HIGH
  { input: "I'm cutting again, can't stop", expected: 'HIGH' },
  { input: "Bought drugs, about to use", expected: 'HIGH' },
  
  // Should trigger MODERATE
  { input: "I'm so hopeless, nothing matters", expected: 'MODERATE' },
  { input: "Can't go on like this", expected: 'MODERATE' },
  
  // Should NOT trigger
  { input: "Having a tough day but managing", expected: 'NONE' },
  { input: "Feeling anxious about work", expected: 'NONE' }
];
```

---

**Remember:** Crisis detection is about saving lives. Better to over-detect and show resources than miss someone in danger.
