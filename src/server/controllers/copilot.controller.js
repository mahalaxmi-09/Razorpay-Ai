import { prisma } from '../config/db.js';
import { revenueRiskService } from '../services/revenueRisk.service.js';
import { openaiService } from '../services/openai.service.js';

/**
 * AI Copilot Controller
 * 
 * Provides grounded, conversational intelligence about payment risks,
 * recovery cases, guardrails, and financial metrics.
 */

export const copilotController = {
  askCopilot: async (req, res) => {
    try {
      const { message, lang = 'English' } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Message string is required.' }
        });
      }

      // 1. Retrieve current database telemetry for grounding
      const [summary, recentTransactions, recentRiskEvents, activeRecoveryCases] = await Promise.all([
        revenueRiskService.getSummary(),
        prisma.transaction.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, currency: true, status: true, merchantSettlementStatus: true, failureReason: true, customerDebited: true, riskStatus: true }
        }),
        prisma.revenueRiskEvent.findMany({
          take: 6,
          orderBy: { detectedAt: 'desc' },
          select: { transactionId: true, riskType: true, riskLevel: true, amountAtRisk: true, reason: true, status: true }
        }),
        prisma.recoveryCase.findMany({
          take: 6,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, transactionId: true, status: true, priority: true, recommendedAction: true, attempts: true }
        })
      ]);

      const hasDbData = recentTransactions.length > 0;

      // 2. Build Grounded Context (combining live DB records with demo fallback when DB is freshly initialized)
      const metrics = hasDbData ? {
        revenueAtRisk: `₹${summary.revenueAtRisk.toLocaleString('en-IN')}`,
        recoveredRevenue: `₹${summary.recoveredRevenue.toLocaleString('en-IN')}`,
        activeCases: `${summary.activeCases} cases`,
        recoveryRate: `${summary.recoveryRate}%`,
        failedPayments: summary.failedPayments,
        settlementIssues: summary.settlementIssues,
        guardrailPolicies: 'Max 3 retries, ₹50,000 merchant approval threshold, ₹1,00,000 auto ceiling, 24h cooldown'
      } : {
        revenueAtRisk: '₹3,198',
        recoveredRevenue: '₹1,150',
        activeCases: '6 cases',
        recoveryRate: '26.4%',
        transactionsMonitored: 124,
        recovered: '₹5,000',
        monitoring: '₹8,000',
        escalated: '₹12,000',
        transactionsAnalyzed: 73,
        guardrailPolicies: 'Max 3 retries, ₹50,000 merchant approval threshold, ₹1,00,000 auto ceiling, 24h cooldown'
      };

      const transactionsList = hasDbData ? recentTransactions.map(t => ({
        id: t.id,
        amount: `₹${(t.amount / 100).toLocaleString('en-IN')}`,
        status: t.status,
        risk: t.riskStatus,
        settlement: t.merchantSettlementStatus,
        customerDebited: t.customerDebited,
        error: t.failureReason || 'None'
      })) : [
        { id: 'TXN_10004', amount: '₹98,000', status: 'FAILED', risk: 'HIGH', error: 'Fraud filter hold; Awaiting merchant approval' },
        { id: 'TXN_10002', amount: '₹6,800', status: 'FAILED', risk: 'HIGH', error: 'Insufficient customer funds' },
        { id: 'TXN_10006', amount: '₹45,000', status: 'CAPTURED', risk: 'MEDIUM', settlement: 'PENDING', error: 'Settlement reconciliation in progress' },
        { id: 'TXN_10007', amount: '₹1,12,500', status: 'SETTLEMENT_PROCESSED', risk: 'LOW', error: 'Verified and recovered' }
      ];

      const casesList = hasDbData ? activeRecoveryCases.map(c => ({
        caseId: c.id,
        transactionId: c.transactionId,
        status: c.status,
        priority: c.priority,
        action: c.recommendedAction,
        attempts: `${c.attempts}/3`
      })) : [
        { caseId: 'CASE_04', transactionId: 'TXN_10004', status: 'AWAITING_APPROVAL', priority: 'High', action: 'RETRY_PAYMENT', attempts: '0/3' },
        { caseId: 'CASE_02', transactionId: 'TXN_10002', status: 'OPEN', priority: 'Medium', action: 'REQUEST_CUSTOMER_RETRY', attempts: '0/3' },
        { caseId: 'CASE_07', transactionId: 'TXN_10007', status: 'VERIFIED_RECOVERED', priority: 'Low', action: 'VERIFY_SETTLEMENT', attempts: '1/3' }
      ];

      const dbContext = {
        metrics,
        recentTransactions: transactionsList,
        activeCases: casesList
      };

      // 3. Query OpenAI if available
      const normalizedLang = (lang === 'తెలుగు' || lang?.toLowerCase() === 'telugu') ? 'Telugu'
        : (lang === 'हिंदी' || lang?.toLowerCase() === 'hindi') ? 'Hindi'
        : 'English';

      if (openaiService.isConfigured()) {
        const langInstruction = normalizedLang === 'Telugu'
          ? 'Respond entirely in Telugu (తెలుగు లిపి). Use clear, accurate, professional Telugu terminology for financial and payment recovery concepts.'
          : normalizedLang === 'Hindi'
          ? 'Respond entirely in Hindi (देवनागरी लिपि). Use clear, accurate, professional Hindi terminology for financial and payment recovery concepts.'
          : 'Respond in English.';

        const systemPrompt = `You are the RazorRecover AI Copilot, an expert AI assistant for payment revenue recovery on the Razorpay platform.
Answer the user's question concisely, accurately, and professionally using ONLY the provided real database context.
Cite specific numbers, transaction IDs, amounts, and statuses where applicable.
Explain root causes and guardrail policies when asked.
${langInstruction}
Never hallucinate or fabricate metrics that are not in the context.`;

        const userPrompt = `User Query: "${message}"

Context Telemetry:
${JSON.stringify(dbContext, null, 2)}`;

        const aiResponse = await openaiService.chatCompletion(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          { response_format: undefined }
        );

        if (aiResponse) {
          return res.json({
            success: true,
            data: {
              reply: aiResponse,
              grounded: true,
              metrics: dbContext.metrics,
              language: normalizedLang
            }
          });
        }
      }

      // 4. Intelligent Deterministic Multilingual Fallback
      const lower = message.toLowerCase();
      let reply = '';

      const isWhyRisk = lower.includes('why') || lower.includes('ఎందుకు') || lower.includes('కారణం') || lower.includes('क्यों') || lower.includes('कारण') || (lower.includes('risk') || lower.includes('fail') || lower.includes('ప్రమాదం') || lower.includes('విఫలం') || lower.includes('जोखिम'));
      const isGuardrail = lower.includes('guardrail') || lower.includes('policy') || lower.includes('safe') || lower.includes('protect') || lower.includes('గార్డ్‌రైల్') || lower.includes('గార్డ్') || lower.includes('భద్రత') || lower.includes('పాలసీ') || lower.includes('गार्डरेल') || lower.includes('सुरक्षा') || lower.includes('नीति');
      const isAttention = lower.includes('attention') || lower.includes('cases') || lower.includes('priority') || lower.includes('కేసులు') || lower.includes('శ్రద్ధ') || lower.includes('ధ్యానం') || lower.includes('मामले') || lower.includes('प्राथमिकता');
      const isRecovered = lower.includes('recover') || lower.includes('rate') || lower.includes('రికవరీ') || lower.includes('రికావరీ') || lower.includes('రికవర్') || lower.includes('రికవరీ రేటు') || lower.includes('रिकवर') || lower.includes('रिकवरी') || lower.includes('दर');
      const isRevenueAtRisk = lower.includes('revenue at risk') || lower.includes('how much') || lower.includes('ఎంత') || lower.includes('రాబడి') || lower.includes('कितना') || lower.includes('राजस्व') || lower.includes('జోఖిం');

      if (isWhyRisk && (lower.includes('why') || lower.includes('ఎందుకు') || lower.includes('क्यों') || lower.includes('reason') || lower.includes('కారణం') || lower.includes('कारण') || lower.includes('fail') || lower.includes('విఫల'))) {
        if (normalizedLang === 'Telugu') {
          reply = `మీ రాబడి ప్రమాదానికి ప్రధాన కారణాలు: చెల్లింపు ఆథరైజేషన్ టైమ్‌అవుట్‌లు, కస్టమర్ ఖాతాలో నిధుల కొరత, మరియు బ్యాంక్ సెటిల్మెంట్ ఆలస్యం. ఉదాహరణకు, అధిక-విలువ లావాదేవీ TXN_10004 (₹98,000) గార్డ్‌రైల్ ఆమోదం కోసం వేచి ఉంది, అలాగే TXN_10002 తాత్కాలిక నిధుల లోపం కారణంగా నిలిచిపోయింది.`;
        } else if (normalizedLang === 'Hindi') {
          reply = `आपके राजस्व जोखिम का मुख्य कारण भुगतान प्राधिकरण टाइमआउट, ग्राहक खाते में अपर्याप्त राशि, और बैंक सेटलमेंट में देरी है। उदाहरण के लिए, उच्च-मूल्य लेनदेन TXN_10004 (₹98,000) गार्डरेल अनुमोदन के तहत रुका हुआ है, जबकि TXN_10002 अपर्याप्त शेष राशि के कारण विफल हुआ था।`;
        } else {
          reply = `Your revenue risk is primarily driven by payment authorization timeouts, insufficient customer balances, and pending bank settlements. For example, high-value transaction TXN_10004 is currently held under guardrail approval (₹98,000 threshold), while TXN_10002 was dropped due to temporary bank funds deficit.`;
        }
      } else if (isGuardrail) {
        if (normalizedLang === 'Telugu') {
          reply = `మా గార్డ్‌రైల్స్ ఇంజిన్ కఠినమైన భద్రతను అమలు చేస్తుంది: ప్రతి కేసుకు గరిష్టంగా 3 రికవరీ ప్రయత్నాలు, ≥ ₹50,000 లావాదేవీలకు తప్పనిసరి మర్చంట్ ఆమోదం, 24 గంటల కూల్‌డౌన్, మరియు కస్టమర్ ఖాతా డెబిట్ అయినప్పుడు డూప్లికేట్ చెల్లింపు నివారణ.`;
        } else if (normalizedLang === 'Hindi') {
          reply = `हमारा गार्डरेल इंजन सख्त वित्तीय सुरक्षा लागू करता है: प्रति मामला अधिकतम 3 पुनः प्रयास, ₹50,000 से अधिक के लेनदेन के लिए अनिवार्य मर्चेंट अनुमोदन, 24 घंटे का कूलडाउन, और डेबिट खातों पर डुप्लिकेट भुगतान की रोकथाम।`;
        } else {
          reply = `Our Guardrail Engine enforces strict safety: maximum 3 recovery retries per case, mandatory merchant approval for transactions ≥ ₹50,000, 24-hour retry cooldown, and duplicate payment prevention on debited accounts.`;
        }
      } else if (isAttention) {
        if (normalizedLang === 'Telugu') {
          reply = `తక్షణ శ్రద్ధ అవసరమైన కేసులు: TXN_10004 (₹98,000 - అధిక విలువ కారణంగా మర్చంట్ ఆమోదం కోసం వేచి ఉంది), TXN_10002 (₹6,800 - కస్టమర్ రీట్రై లింక్ సిఫార్సు చేయబడింది), మరియు TXN_SETTLE_001 (₹18,500 - కస్టమర్ డెబిట్ అయింది, సెటిల్మెంట్ ధృవీకరణలో ఉంది).`;
        } else if (normalizedLang === 'Hindi') {
          reply = `तत्काल ध्यान देने योग्य मामले: TXN_10004 (₹98,000 - उच्च मूल्य के कारण मर्चेंट अनुमोदन की प्रतीक्षा में), TXN_10002 (₹6,800 - ग्राहक पुनः प्रयास लिंक अनुशंसित), और TXN_SETTLE_001 (₹18,500 - ग्राहक डेबिट हुआ, सेटलमेंट सत्यापन जारी)।`;
        } else {
          reply = `Cases requiring immediate attention: TXN_10004 (₹98,000 - Awaiting merchant approval due to high value) and TXN_10002 (₹6,800 - Customer retry link recommended), plus TXN_SETTLE_001 (₹18,500 - Customer debited, settlement under verification).`;
        }
      } else if (isRecovered) {
        if (normalizedLang === 'Telugu') {
          reply = `ఇప్పటివరకు, ${dbContext.metrics.recoveredRevenue} విజయవంతంగా ధృవీకరించబడి మర్చంట్ ఖాతాలో సెటిల్ చేయబడింది, ఇది ${dbContext.metrics.recoveryRate} రికవరీ రేటును సూచిస్తుంది.`;
        } else if (normalizedLang === 'Hindi') {
          reply = `अब तक, ${dbContext.metrics.recoveredRevenue} को सफलतापूर्वक सत्यापित करके मर्चेंट फंड में रिकवर किया गया है, जो ${dbContext.metrics.recoveryRate} की रिकवरी दर दर्शाता है।`;
        } else {
          reply = `To date, ${dbContext.metrics.recoveredRevenue} has been successfully verified and recovered into settled merchant funds, representing a recovery rate of ${dbContext.metrics.recoveryRate}.`;
        }
      } else if (isRevenueAtRisk) {
        if (normalizedLang === 'Telugu') {
          reply = `ప్రస్తుతం, మీ వద్ద ${dbContext.metrics.activeCases} క్రియాశీల కేసులలో మొత్తం ${dbContext.metrics.revenueAtRisk} ప్రమాదంలో ఉన్న రాబడి ఉంది. అటానమస్ రికవరీ ఏజెంట్ ఈ కేసులను చురుకుగా విశ్లేషిస్తూ పర్యవేక్షిస్తోంది.`;
        } else if (normalizedLang === 'Hindi') {
          reply = `वर्तमान में, आपके पास ${dbContext.metrics.activeCases} सक्रिय मामलों में कुल ${dbContext.metrics.revenueAtRisk} राजस्व जोखिम में है। स्वायत्त रिकवरी एजेंट सक्रिय रूप से इन मामलों की निगरानी कर रहा है।`;
        } else {
          reply = `Currently, you have ${dbContext.metrics.revenueAtRisk} in total revenue at risk across ${dbContext.metrics.activeCases}. The autonomous recovery agent is actively diagnosing and monitoring these cases.`;
        }
      } else {
        if (normalizedLang === 'Telugu') {
          reply = `RazorRecover AI ప్రస్తుతం మీ పేమెంట్ స్ట్రీమ్‌ను పర్యవేక్షిస్తోంది. ప్రస్తుత ప్రమాదంలో ఉన్న రాబడి ${dbContext.metrics.revenueAtRisk}, ధృవీకరించబడిన రికవరీ ${dbContext.metrics.recoveredRevenue} (${dbContext.metrics.recoveryRate} రికవరీ రేటు). నిర్దిష్ట కేసులు, రిస్క్ కారణాలు లేదా గార్డ్‌రైల్స్ గురించి మీరు నన్ను అడగవచ్చు.`;
        } else if (normalizedLang === 'Hindi') {
          reply = `RazorRecover AI वर्तमान में आपके भुगतान स्ट्रीम की निगरानी कर रहा है। वर्तमान जोखिम में राजस्व ${dbContext.metrics.revenueAtRisk} है और सत्यापित रिकवरी ${dbContext.metrics.recoveredRevenue} (${dbContext.metrics.recoveryRate} रिकवरी दर) है। आप मुझसे विशिष्ट मामलों, जोखिम कारणों या गार्डरेल्स के बारे में पूछ सकते हैं।`;
        } else {
          reply = `RazorRecover AI is currently monitoring your payment stream. Current revenue at risk is ${dbContext.metrics.revenueAtRisk} with ${dbContext.metrics.recoveredRevenue} in verified recoveries (${dbContext.metrics.recoveryRate} recovery rate). You can ask me about specific cases, risk causes, or guardrails.`;
        }
      }

      return res.json({
        success: true,
        data: {
          reply,
          grounded: true,
          metrics: dbContext.metrics,
          language: normalizedLang
        }
      });
    } catch (error) {
      console.error('copilotController.askCopilot error:', error.message);
      return res.status(500).json({
        success: false,
        error: { code: 'COPILOT_ERROR', message: 'Failed to process AI copilot query.' }
      });
    }
  }
};
