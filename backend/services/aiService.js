const db = require('../config/db');
const socketConfig = require('../config/socket');

/**
 * A Smart Heuristics Engine to act as an AI Priority Engine locally.
 */
exports.analyzeEmergency = async (emergencyId) => {
  try {
    const [emergencies] = await db.query('SELECT * FROM emergencies WHERE id = ?', [emergencyId]);
    if (emergencies.length === 0) return;
    const emergency = emergencies[0];

    // 1. Gather context
    const [availableResponders] = await db.query(
      "SELECT count(*) as count FROM users WHERE role IN ('driver', 'hospital_admin') AND availability = 'AVAILABLE'"
    );
    const respondersCount = availableResponders[0].count;

    const [activeEmergencies] = await db.query(
      "SELECT count(*) as count FROM emergencies WHERE status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESPONDING')"
    );
    const activeCount = activeEmergencies[0].count;

    // 2. Score Calculation (0-100)
    let score = 50; 
    let riskFactors = [];

    // Severity based
    if (emergency.severity === 'CRITICAL') { score += 30; riskFactors.push("High initial severity reported."); }
    else if (emergency.severity === 'HIGH') { score += 20; riskFactors.push("High initial severity reported."); }
    else if (emergency.severity === 'LOW') { score -= 10; }

    // Type based
    const type = emergency.type.toLowerCase();
    if (type.includes('medical') || type.includes('fire')) { score += 15; riskFactors.push(`Type is ${emergency.type}.`); }
    if (type.includes('accident')) { score += 10; riskFactors.push("Accident - requires rapid deployment."); }

    // System load based
    if (respondersCount === 0) { 
      score += 15; 
      riskFactors.push("No available responders currently."); 
    }
    if (activeCount > 5) {
      score += 5;
      riskFactors.push("High volume of active emergencies in the system.");
    }

    // Text parsing
    const desc = (emergency.description || '').toLowerCase();
    if (desc.includes('unconscious') || desc.includes('not breathing') || desc.includes('bleeding')) {
      score += 20;
      riskFactors.push("Keywords indicate life-threatening situation.");
    }

    // Cap score at 100
    score = Math.min(score, 100);
    score = Math.max(score, 0);

    // Determine Level
    let level = 'LOW';
    if (score >= 80) level = 'CRITICAL';
    else if (score >= 60) level = 'HIGH';
    else if (score >= 40) level = 'MEDIUM';

    // Generate Recommendation
    let recommendation = "Dispatch responder standard priority.";
    if (level === 'CRITICAL') recommendation = "Immediate dispatch required. Escalate to Admin if unassigned for 2 minutes.";
    else if (level === 'HIGH') recommendation = "Dispatch nearest responder quickly.";

    // 3. Save to database
    await db.query(
      `UPDATE emergencies SET ai_priority_score = ?, ai_priority_level = ?, ai_recommendation = ?, ai_analyzed_at = NOW() WHERE id = ?`,
      [score, level, recommendation, emergencyId]
    );

    await db.query(
      `INSERT INTO emergency_ai_analysis (emergency_id, priority_score, priority_level, recommendation, risk_factors) VALUES (?, ?, ?, ?, ?)`,
      [emergencyId, score, level, recommendation, JSON.stringify(riskFactors)]
    );

    // 4. Notify via sockets
    const io = socketConfig.getIO();
    io.emit('analytics_updated');
    io.emit('priority_updated', { emergency_id: emergencyId, ai_priority_score: score, ai_priority_level: level });

    // If critical, escalate
    if (level === 'CRITICAL') {
      io.to('responders').emit('notification', { message: `AI ALERT: Emergency #${emergencyId} prioritized as CRITICAL.` });
    }

    console.log(`AI Analysis complete for Emergency #${emergencyId}. Score: ${score}, Level: ${level}`);
  } catch (err) {
    console.error('AI Analysis failed:', err);
    // Silent fail so it doesn't break emergency workflow
  }
};
