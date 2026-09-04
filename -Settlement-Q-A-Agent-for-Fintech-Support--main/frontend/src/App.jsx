import React, { useEffect, useRef, useState } from "react";

// Bank Directory
const BANK_LIST = [
  { id: 'sbi', name: 'State Bank of India', logo: 'https://logo.clearbit.com/sbi.co.in' },
  { id: 'hdfc', name: 'HDFC Bank', logo: 'https://logo.clearbit.com/hdfcbank.com' },
  { id: 'icici', name: 'ICICI Bank', logo: 'https://logo.clearbit.com/icicibank.com' },
  { id: 'axis', name: 'Axis Bank', logo: 'https://logo.clearbit.com/axisbank.com' },
  { id: 'pnb', name: 'Punjab National Bank', logo: 'https://logo.clearbit.com/pnbindia.in' },
  { id: 'bob', name: 'Bank of Baroda', logo: 'https://logo.clearbit.com/bankofbaroda.in' },
  { id: 'airtel', name: 'Airtel Payments Bank', logo: 'https://logo.clearbit.com/airtel.in' }
];

// Mock Visual Transaction History
const MOCK_HISTORY = [
  { id: 'TXN_1001', amount: '₹12,400', date: 'Today, 02:14 PM', status: 'Success', bank: 'HDFC Bank' },
  { id: 'TXN_1002', amount: '₹4,500', date: 'Today, 11:30 AM', status: 'Failed', bank: 'State Bank of India' },
  { id: 'TXN_1003', amount: '₹25,000', date: 'Yesterday', status: 'Pending', bank: 'ICICI Bank' },
  { id: 'TXN_1004', amount: '₹8,200', date: '02 Sep', status: 'On Hold', bank: 'Axis Bank' },
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);

  // Workflow State Management
  const [step, setStep] = useState(1);
  const [kycType, setKycType] = useState('aadhaar');
  const [kycValue, setKycValue] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [txnId, setTxnId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null);

  // Advanced Feature States
  const [slaTime, setSlaTime] = useState(86400); // 24 Hours Countdown
  const [showAiModal, setShowAiModal] = useState(false);
  const [smartDetected, setSmartDetected] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am FINyX Assistant. Ask me anything about your stuck payment, RBI SLA, or auto-reversals.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  // SLA Countdown Timer Effect
  useEffect(() => {
    if (step === 6 && slaTime > 0) {
      const timer = setInterval(() => {
        setSlaTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, slaTime]);

  // Initial loader entrance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Shared particle background engine
  const setupParticles = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2.5 + 1,
      color: ["#38bdf8", "#0284c7", "#34d399", "#10b981", "#ffffff"][
        Math.floor(Math.random() * 5)
      ],
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.2 - 0.3,
      alpha: Math.random() * 0.8 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  };

  useEffect(() => {
    if (isLoading) return;
    const cleanup1 = setupParticles(canvasRef1.current);
    const cleanup2 = setupParticles(canvasRef2.current);
    return () => {
      if (cleanup1) cleanup1();
      if (cleanup2) cleanup2();
    };
  }, [isLoading]);

  // Format SLA Countdown
  const formatSlaTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!kycValue) return alert('Please enter your details');
    setStep(3);
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    if (!otp) return alert('Please enter OTP');
    setStep(4);
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setStep(5);
  };

  // FEATURE 1: Smart Transaction Input Detection
  const handleTxnInput = (val) => {
    setTxnId(val);
    if (val.trim().length >= 6) {
      setSmartDetected(true);
    } else {
      setSmartDetected(false);
    }
  };

  const selectHistoryTxn = (item) => {
    setTxnId(item.id);
    setSmartDetected(true);
  };

  const runDiagnosticCheck = async (e) => {
    e.preventDefault();
    if (!txnId) return alert('Please enter a Transaction ID');

    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:8000/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_id: txnId.trim() })
      });

      const data = await response.json();
      setDiagnostic(data);
      setStep(6);
    } catch (err) {
      evaluateFallbackRule(txnId);
      setStep(6);
    } finally {
      setIsProcessing(false);
    }
  };

  // FEATURE 5, 6, 8, 9: Advanced Rules Diagnostic Evaluation
  const evaluateFallbackRule = (id) => {
    const uppercaseId = id.toUpperCase();
    
    if (uppercaseId === 'TXN_1002') {
      setDiagnostic({
        issueType: 'GATEWAY_SERVER_ISSUE',
        healthScore: 32,
        healthLabel: 'Critical Failure',
        confidenceScore: 96,
        rootCause: 'Gateway Switch Timeout (NPCI Rail Disconnect)',
        exceptions: ['HTTP 504 Gateway Timeout', 'NPCI Switch Unreachable', 'Auto-Reversal Flagged'],
        title: 'Gateway Switch Server Failure',
        note: 'Payment was dropped at the payment switch layer before reaching beneficiary bank rails.',
        aiExplanation: 'Your money is safe! The payment switch disconnected before your bank could acknowledge reception. The engine has scheduled an automated reversal.',
        action: 'Auto-reversal initiated under RBI settlement rules.'
      });
    } else if (uppercaseId === 'TXN_1003') {
      setDiagnostic({
        issueType: 'BANK_SLA_ISSUE',
        healthScore: 68,
        healthLabel: 'SLA Delay',
        confidenceScore: 89,
        rootCause: 'Destination Bank Processing Queue Backlog',
        exceptions: ['T+1 Settlement Window Active', 'Batch Queue Processing Delay'],
        title: 'Bank SLA Clearing Backlog',
        note: 'Gateway successfully transferred funds, but the beneficiary bank is holding them in a clearance queue.',
        aiExplanation: 'The switch transferred your money, but the receiving bank has not cleared the batch due to weekend/holiday processing backlogs.',
        action: 'Monitored under RBI T+1 SLA guidelines. Auto-clearing in progress.'
      });
    } else if (uppercaseId === 'TXN_1004') {
      setDiagnostic({
        issueType: 'BANK_INTERNAL_ISSUE',
        healthScore: 18,
        healthLabel: 'Account Hold',
        confidenceScore: 94,
        rootCause: 'Beneficiary Account Compliance Restriction',
        exceptions: ['Beneficiary Account Frozen', 'KYC Mandate Renewal Required'],
        title: 'Destination Account Credit Restriction',
        note: 'The server completed the transmission, but the destination bank rejected credit due to account compliance locks.',
        aiExplanation: 'Your bank sent the money, but the receiver’s bank rejected the deposit because the target account is restricted or requires KYC updates.',
        action: 'Contact beneficiary bank support to unfreeze account.'
      });
    } else {
      setDiagnostic({
        issueType: 'SUCCESS',
        healthScore: 98,
        healthLabel: 'Optimal Health',
        confidenceScore: 99,
        rootCause: 'None (All Systems Operational)',
        exceptions: ['No System Exceptions Detected'],
        title: 'Settlement Cleared Successfully',
        note: 'No server switch errors, bank SLA delays, or account locks found.',
        aiExplanation: 'Everything looks good! Your transaction cleared through all gateway switches successfully.',
        action: 'UTR generated and updated in banking records.'
      });
    }
  };

  // FEATURE 9: Automated Retry Refresh Trigger
  const triggerAutomatedRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      alert('Automated Network Ping Complete: Re-queried NPCI and Gateway Nodes. Status remains updated.');
    }, 2000);
  };

  // FEATURE 10: Downloadable Resolution Report
  const downloadReport = () => {
    const reportText = `
==================================================
           FINyX RESOLUTION AUDIT REPORT
==================================================
Date: ${new Date().toLocaleString()}
Transaction ID: ${txnId}
Selected Bank: ${selectedBank?.name || 'N/A'}
Health Score: ${diagnostic?.healthScore}/100 (${diagnostic?.healthLabel})
AI Confidence Score: ${diagnostic?.confidenceScore}%
Root Cause: ${diagnostic?.rootCause}

Summary Title: ${diagnostic?.title}
Details: ${diagnostic?.note}
Recommended Action: ${diagnostic?.action}

Exception Log:
${diagnostic?.exceptions?.map(ex => ` - ${ex}`).join('\n')}
==================================================
Generated by FINyX Automated Settlement Engine
==================================================
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FINyX_Report_${txnId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // FEATURE 7: Ask FINyX Chatbot Logic
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      let reply = "I am monitoring the gateway switch logs. You can run a diagnostic check or download the resolution report.";
      const lower = userText.toLowerCase();
      if (lower.includes('stuck') || lower.includes('money')) {
        reply = "Money is usually stuck due to a gateway timeout or destination bank SLA clearing queue. Use the 'Why is my money stuck?' button for a plain-English explanation.";
      } else if (lower.includes('refund') || lower.includes('time')) {
        reply = "According to RBI SLA mandates, failed or stuck transactions auto-reverse within 24 to 48 hours (T+1 day).";
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 800);
  };

  const resetWorkflow = () => {
    setStep(1);
    setKycValue('');
    setOtp('');
    setSelectedBank(null);
    setTxnId('');
    setDiagnostic(null);
    setSmartDetected(false);
    setSlaTime(86400);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; margin: 0; padding: 0; background-color: #020617; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }
        
        @keyframes zoomOutEntrance {
          0% { transform: scale(1.25); opacity: 0; filter: blur(10px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .snap-container {
          width: 100vw; height: 100vh; overflow-y: scroll; overflow-x: hidden;
          scroll-snap-type: y mandatory; scroll-behavior: smooth;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .snap-container::-webkit-scrollbar { display: none; }

        .finyx-card {
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 20px;
          padding: 30px;
          width: 100%;
          max-width: 580px;
          box-shadow: 0 0 60px rgba(2, 132, 199, 0.2);
          color: #f8fafc;
          text-align: center;
          position: relative;
        }

        .finyx-input {
          width: 100%; padding: 12px 16px; border-radius: 10px;
          border: 1px solid #334155; background-color: #020617;
          color: #ffffff; font-size: 14px; outline: none; margin-bottom: 12px;
        }

        .finyx-btn {
          width: 100%; padding: 12px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #0284c7, #0369a1);
          color: #ffffff; font-weight: bold; font-size: 14px; cursor: pointer;
          transition: all 0.3s ease;
        }
        .finyx-btn:hover { transform: translateY(-2px); box-shadow: 0 0 20px rgba(56, 189, 248, 0.5); }

        .ai-btn { background: linear-gradient(135deg, #8b5cf6, #6d28d9); border: 1px solid #a78bfa; margin-top: 8px; }
        .ai-btn:hover { box-shadow: 0 0 20px rgba(167, 139, 250, 0.5); }

        .download-btn { background: linear-gradient(135deg, #10b981, #047857); margin-top: 8px; }
        .retry-btn { background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; color: #38bdf8; margin-top: 8px; }

        .bank-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          max-height: 220px; overflow-y: auto; margin-bottom: 15px;
        }
        .bank-card {
          display: flex; align-items: center; gap: 10px; padding: 10px;
          background: #020617; border: 1px solid #1e293b; border-radius: 10px;
          cursor: pointer; transition: all 0.2s ease;
        }
        .bank-card:hover { border-color: #38bdf8; transform: scale(1.02); }

        .history-list {
          display: flex; flex-direction: column; gap: 6px;
          max-height: 140px; overflow-y: auto; margin-bottom: 12px; text-align: left;
        }
        .history-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; background: #020617; border: 1px solid #1e293b;
          border-radius: 8px; cursor: pointer; font-size: 11px;
        }
        .history-item:hover { border-color: #38bdf8; }
        .badge { padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
        .badge-success { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .badge-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .badge-failed { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .health-bar-container {
          width: 100%; height: 8px; background: #0f172a; border-radius: 4px;
          overflow: hidden; margin: 6px 0; border: 1px solid #334155;
        }
        .health-bar-fill { height: 100%; transition: width 0.8s ease; }

        /* Modal & Drawer UI */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(8px); z-index: 1000; display: flex;
          align-items: center; justify-content: center; padding: 20px;
        }
        .modal-card {
          background: #0f172a; border: 1px solid #8b5cf6; border-radius: 16px;
          padding: 24px; max-width: 450px; width: 100%; text-align: left;
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
        }

        .chat-drawer {
          position: fixed; right: 0; top: 0; bottom: 0; width: 340px;
          background: #0f172a; border-left: 1px solid #38bdf8; z-index: 1001;
          display: flex; flexDirection: column; padding: 20px; box-shadow: -10px 0 30px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* CHATBOT TRIGGER FLOATING BUTTON */}
      <button 
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 999,
          padding: '12px 20px', borderRadius: '30px', background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
          color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)'
        }}
        onClick={() => setShowChatbot(!showChatbot)}
      >
        💬 Ask FINyX AI
      </button>

      {/* FEATURE 7: ASK FINYX CHATBOT DRAWER */}
      {showChatbot && (
        <div className="chat-drawer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #1e293b', pb: '10px' }}>
            <h3 style={{ fontSize: '16px', color: '#38bdf8' }}>🤖 FINyX AI Assistant</h3>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }} onClick={() => setShowChatbot(false)}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
            {chatMessages.map((msg, index) => (
              <div key={index} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user' ? '#0284c7' : '#1e293b',
                color: '#fff', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', maxWidth: '85%'
              }}>
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              placeholder="Ask a question..." 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              className="finyx-input" 
              style={{ marginBottom: 0, fontSize: '12px' }}
            />
            <button type="submit" className="finyx-btn" style={{ width: 'auto', padding: '0 16px' }}>Send</button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "#020617", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
          <div style={{ width: "50px", height: "50px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 1s infinite linear" }} />
          <span style={{ marginTop: "16px", letterSpacing: "4px", fontSize: "12px", textTransform: "uppercase", color: "#38bdf8" }}>
            Connecting Banking Gateway...
          </span>
        </div>
      ) : (
        <div className="snap-container">
          
          {/* SECTION 1: HERO BANKING VAULT */}
          <section style={{ position: "relative", width: "100vw", height: "100vh", scrollSnapAlign: "start", overflow: "hidden", animation: "zoomOutEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.45 }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #020617 0%, rgba(2, 6, 23, 0.5) 50%, rgba(2, 6, 23, 0.8) 100%)" }} />
            </div>

            <canvas ref={canvasRef1} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} />

            <div style={{ position: "relative", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 20px" }}>
              <h1 style={{ fontSize: "clamp(38px, 6.5vw, 88px)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "6px", margin: "0 0 10px 0", color: "#ffffff", fontFamily: "serif" }}>
                FINyX
              </h1>
              <p style={{ color: '#38bdf8', letterSpacing: '3px', marginBottom: '30px', textTransform: 'uppercase', fontSize: '13px', fontWeight: 'bold' }}>
                Automated Bank Reconciliation & Multi-Rail Gateway Engine
              </p>

              <button className="finyx-btn" style={{ width: 'auto', padding: '16px 40px', fontSize: '18px' }} onClick={() => document.getElementById("workflow-section")?.scrollIntoView({ behavior: "smooth" })}>
                Enter Engine →
              </button>
            </div>
          </section>

          {/* SECTION 2: WORKFLOW ARENA */}
          <section id="workflow-section" style={{ position: "relative", width: "100vw", height: "100vh", scrollSnapAlign: "start", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url('https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2000&auto=format&fit=crop')`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.4 }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #020617 0%, rgba(2, 6, 23, 0.6) 50%, #020617 100%)" }} />
            </div>

            <canvas ref={canvasRef2} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} />

            <div style={{ position: "relative", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 20px" }}>
              <div className="finyx-card">

                {/* STEP 1: WELCOME */}
                {step === 1 && (
                  <div>
                    <h2 style={{ fontSize: '26px', color: '#38bdf8', marginBottom: '8px' }}>Welcome to FINyX</h2>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '25px' }}>
                      Analyze gateway logs, trace bank SLA delays, and resolve stuck payments.
                    </p>
                    <button className="finyx-btn" onClick={() => setStep(2)}>
                      Proceed to Verification →
                    </button>
                  </div>
                )}

                {/* STEP 2: AUTH */}
                {step === 2 && (
                  <form onSubmit={handleAuthSubmit}>
                    <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Identity Verification</h2>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '15px' }}>Login / Sign up via Aadhaar or PAN</p>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <label style={{ flex: 1, padding: '10px', background: '#020617', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                        <input type="radio" value="aadhaar" checked={kycType === 'aadhaar'} onChange={() => setKycType('aadhaar')} /> Aadhaar
                      </label>
                      <label style={{ flex: 1, padding: '10px', background: '#020617', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                        <input type="radio" value="pan" checked={kycType === 'pan'} onChange={() => setKycType('pan')} /> PAN
                      </label>
                    </div>

                    <input type="text" placeholder={kycType === 'aadhaar' ? 'Enter 12-digit Aadhaar' : 'Enter 10-digit PAN'} value={kycValue} onChange={(e) => setKycValue(e.target.value)} className="finyx-input" required />
                    <button type="submit" className="finyx-btn">Send Temporary OTP</button>
                  </form>
                )}

                {/* STEP 3: OTP */}
                {step === 3 && (
                  <form onSubmit={handleOtpVerify}>
                    <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Security OTP</h2>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '15px' }}>Enter 6-digit code sent to registered mobile</p>
                    <input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="finyx-input" style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '18px' }} required />
                    <button type="submit" className="finyx-btn">Verify OTP</button>
                  </form>
                )}

                {/* STEP 4: BANK SELECT */}
                {step === 4 && (
                  <div>
                    <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Select Bank</h2>
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>Choose issuer / beneficiary bank</p>
                    <div className="bank-grid">
                      {BANK_LIST.map((bank) => (
                        <div key={bank.id} className="bank-card" onClick={() => handleBankSelect(bank)}>
                          <img src={bank.logo} alt={bank.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/24?text=B'; }} />
                          <span style={{ fontSize: '11px', textAlign: 'left', color: '#e2e8f0' }}>{bank.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 5: SMART DETECTION + VISUAL HISTORY INPUT */}
                {step === 5 && (
                  <form onSubmit={runDiagnosticCheck}>
                    <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Analyze Transaction</h2>
                    <p style={{ color: '#38bdf8', fontSize: '12px', marginBottom: '12px' }}>Bank: {selectedBank?.name}</p>

                    {/* FEATURE 2: VISUAL TRANSACTION HISTORY */}
                    <div style={{ textAlign: 'left', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Linked Recent Activity:</span>
                    </div>
                    <div className="history-list">
                      {MOCK_HISTORY.map((item) => (
                        <div key={item.id} className="history-item" onClick={() => selectHistoryTxn(item)}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>{item.id} • {item.amount}</div>
                            <div style={{ color: '#64748b', fontSize: '9px' }}>{item.bank} • {item.date}</div>
                          </div>
                          <span className={`badge ${item.status === 'Success' ? 'badge-success' : item.status === 'Pending' ? 'badge-pending' : 'badge-failed'}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* FEATURE 1: SMART TRANSACTION DETECTION INPUT */}
                    <input 
                      type="text" 
                      placeholder="e.g. TXN_1002, TXN_1003, TXN_1004" 
                      value={txnId} 
                      onChange={(e) => handleTxnInput(e.target.value)} 
                      className="finyx-input" 
                      required 
                    />

                    {smartDetected && (
                      <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', color: '#38bdf8', marginBottom: '10px', textAlign: 'left' }}>
                        ⚡ <b>Smart Pattern Detected:</b> Valid Transaction Format.
                      </div>
                    )}

                    <button type="submit" className="finyx-btn" disabled={isProcessing}>
                      {isProcessing ? 'Tracing Server & Bank Logs...' : 'Run Diagnostic Engine'}
                    </button>
                  </form>
                )}

                {/* STEP 6: ADVANCED DIAGNOSTICS DASHBOARD */}
                {step === 6 && diagnostic && (
                  <div style={{ textAlign: 'left', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                    <h2 style={{ fontSize: '18px', color: '#38bdf8', marginBottom: '8px', textAlign: 'center' }}>Diagnostic Summary</h2>

                    {/* FEATURE 6: HEALTH SCORE + FEATURE 8: CONFIDENCE SCORE */}
                    <div style={{ background: '#020617', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Transaction Health: <b style={{ color: '#fff' }}>{diagnostic.healthScore}/100</b></span>
                        <span style={{ color: '#34d399' }}>AI Certainty: <b>{diagnostic.confidenceScore}%</b></span>
                      </div>
                      <div className="health-bar-container">
                        <div className="health-bar-fill" style={{ width: `${diagnostic.healthScore}%`, backgroundColor: diagnostic.healthScore > 70 ? '#22c55e' : diagnostic.healthScore > 40 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    </div>

                    {/* FEATURE 5: ROOT CAUSE DETECTION */}
                    <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e293b', marginBottom: '8px', fontSize: '11px' }}>
                      <span style={{ color: '#94a3b8' }}>Root Cause: </span>
                      <strong style={{ color: '#f8fafc' }}>{diagnostic.rootCause}</strong>
                    </div>

                    {/* FEATURE 8: EXCEPTION LIST */}
                    <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e293b', marginBottom: '8px', fontSize: '11px' }}>
                      <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Detected System Exceptions:</div>
                      {diagnostic.exceptions?.map((ex, idx) => (
                        <div key={idx} style={{ color: '#ef4444', fontSize: '10px' }}>• {ex}</div>
                      ))}
                    </div>

                    {/* FEATURE 4: SLA COUNTDOWN TIMER */}
                    {diagnostic.issueType !== 'SUCCESS' && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '8px', borderRadius: '6px', marginBottom: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase' }}>RBI Resolution SLA Countdown</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>{formatSlaTime(slaTime)}</div>
                      </div>
                    )}

                    {/* MAIN NOTE */}
                    <div style={{ padding: '10px', background: '#020617', borderRadius: '8px', border: '1px solid #334155', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '13px', color: '#f8fafc', marginBottom: '2px' }}>{diagnostic.title}</h3>
                      <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3' }}>{diagnostic.note}</p>
                    </div>

                    {/* FEATURE 3: "WHY IS MY MONEY STUCK?" AI BUTTON */}
                    <button className="finyx-btn ai-btn" onClick={() => setShowAiModal(true)}>
                      ✨ Why is my money stuck? (AI Breakdown)
                    </button>

                    {/* FEATURE 9: AUTOMATION RETRY REFRESH BUTTON */}
                    <button className="finyx-btn retry-btn" onClick={triggerAutomatedRetry} disabled={isRetrying}>
                      {isRetrying ? 'Re-querying Switch...' : '🔄 Trigger Network Auto-Retry'}
                    </button>

                    {/* FEATURE 10: DOWNLOADABLE RESOLUTION REPORT */}
                    <button className="finyx-btn download-btn" onClick={downloadReport}>
                      📥 Download Audit Report (.txt)
                    </button>

                    <button className="finyx-btn" style={{ marginTop: '8px' }} onClick={() => setStep(7)}>
                      Complete & Finish →
                    </button>
                  </div>
                )}

                {/* STEP 7: THANK YOU */}
                {step === 7 && (
                  <div>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏦</div>
                    <h2 style={{ fontSize: '24px', color: '#38bdf8', marginBottom: '8px' }}>Thank You</h2>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: '1.4' }}>
                      Your query and diagnostic audit have been registered in the banking ledger.
                    </p>
                    <button className="finyx-btn" onClick={resetWorkflow}>
                      Run Another Audit
                    </button>
                  </div>
                )}

              </div>
            </div>
          </section>

          {/* AI BREAKDOWN MODAL */}
          {showAiModal && diagnostic && (
            <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ fontSize: '16px', color: '#a78bfa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✨</span> FINyX AI Breakdown
                </h3>
                <p style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px' }}>
                  {diagnostic.aiExplanation}
                </p>
                <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', fontSize: '11px', color: '#38bdf8', marginBottom: '12px' }}>
                  <strong>Recommended Action:</strong> {diagnostic.action}
                </div>
                <button className="finyx-btn" style={{ background: '#8b5cf6' }} onClick={() => setShowAiModal(false)}>
                  Close Explanation
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}