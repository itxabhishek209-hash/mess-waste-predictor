import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory stats for the "APIs" just as a fallback/mock, 
  // though the main app will use Firebase directly.
  let wasteDataList: any[] = [];
  let mealsBooked = 150; // Mock base bookings
  
  // APIs
  app.post("/api/register-meal", (req, res) => {
    // This is a stub backend endpoint. Main app writes to Firebase directly.
    const { studentId, date, willEat } = req.body;
    if (willEat) mealsBooked++;
    else mealsBooked--;
    res.json({ success: true, mealsBooked });
  });

  app.get("/api/prediction", (req, res) => {
    // Prediction logic: past attendance, day of week, menu
    // We'll use a simple average-based logic for the hackathon
    const baseExpected = mealsBooked; 
    const randomFactor = Math.floor(Math.random() * 20) - 10; // -10 to +10 variance
    const prediction = baseExpected + randomFactor;
    
    // Convert to item amounts (approximate rules of thumb)
    const riceKg = (prediction * 0.15).toFixed(1); // 150g per person
    const dalKg = (prediction * 0.05).toFixed(1);  // 50g per person
    const rotiKg = (prediction * 0.1).toFixed(1);  // 100g per person
    const curryKg = (prediction * 0.15).toFixed(1); // 150g per person
    
    res.json({
      predictedStudents: prediction,
      foodToPrepare: {
        riceKg,
        dalKg,
        rotiKg,
        curryKg
      }
    });
  });

  app.post("/api/waste", (req, res) => {
    const { date, totalWasteKg, riceKg, dalKg, rotiKg, curryKg } = req.body;
    
    const newRecord = {
      id: Date.now().toString(),
      date,
      totalWasteKg: Number(totalWasteKg) || 0,
      riceKg: Number(riceKg) || 0,
      dalKg: Number(dalKg) || 0,
      rotiKg: Number(rotiKg) || 0,
      curryKg: Number(curryKg) || 0,
      timestamp: Date.now()
    };
    
    wasteDataList.push(newRecord);
    res.json({ success: true, record: newRecord });
  });

  app.get("/api/stats", (req, res) => {
    // Generate some mock historical data if empty
    if (wasteDataList.length === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        wasteDataList.push({
          date: d.toISOString().split('T')[0],
          totalWasteKg: Math.floor(Math.random() * 20) + 5, // 5 to 25 kg
        });
      }
    }
    res.json({ wasteData: wasteDataList });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
