import express from "express";
import Question from "../models/Question.js";

const router = express.Router();

router.get("/questions", async (req, res) => {
    try {
        const { category } = req.query;
        const matchStage = category ? { $match: { category } } : { $match: {} };
        
        
        const questions = await Question.aggregate([
            matchStage,
            { $sample: { size: 7 } }
        ]);
        
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/all-questions", async (req, res) => {
    try {
        const questions = await Question.find({});
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/seed", async (req, res) => {
    try {
        const defaultQuestions = [
            
            { text: "Як часто за останній тиждень ви відчували напруження?", options: ["Ніколи", "Рідко", "Часто", "Постійно"], points: [100, 70, 40, 10], order: 1 },
            { text: "Як часто ви відчуваєте, що не справляєтеся з поточними справами?", options: ["Ніколи", "Іноді", "Більшість часу", "Завжди"], points: [100, 70, 30, 0], order: 2 },
            { text: "Наскільки важко вам розслабитися після робочого дня?", options: ["Дуже легко", "Трохи важко", "Важко", "Неможливо"], points: [100, 75, 40, 10], order: 3 },
            
            
            { text: "Наскільки легко вам вдається зосередитися?", options: ["Дуже легко", "Задовільно", "Важко", "Майже неможливо"], points: [100, 70, 40, 10], order: 4 },
            { text: "Як часто ви робите помилки через неуважність останнім часом?", options: ["Рідко", "Як зазвичай", "Частіше", "Постійно"], points: [100, 75, 40, 15], order: 5 },
            { text: "Чи важко вам приймати повсякденні рішення?", options: ["Зовсім ні", "Іноді", "Часто", "Дуже важко"], points: [100, 70, 40, 10], order: 6 },
            
            
            { text: "Як оціните якість свого сну?", options: ["Відмінна", "Задовільна", "Погана", "Жахлива"], points: [100, 70, 30, 0], order: 7 },
            { text: "Як часто ви прокидаєтеся з відчуттям втоми?", options: ["Ніколи", "Рідко", "Часто", "Кожного ранку"], points: [100, 75, 30, 5], order: 8 },
            { text: "Чи помічали ви зміни у своєму апетиті?", options: ["Ні, все стабільно", "Незначні", "Так, суттєві зміни", "Повна втрата/переїдання"], points: [100, 70, 40, 10], order: 9 },
            
            
            { text: "Чи відчуваєте ви підтримку від близьких людей?", options: ["Повну", "Часткову", "Мінімальну", "Зовсім ні"], points: [100, 70, 40, 10], order: 10 },
            { text: "Як часто ви відчуваєте безпричинну тривогу?", options: ["Ніколи", "Рідко", "Часто", "Постійно"], points: [100, 75, 30, 0], order: 11 },
            { text: "Чи здатні ви відчувати радість від звичних речей?", options: ["Так, повною мірою", "Частково", "Рідко", "Зовсім ні"], points: [100, 60, 30, 5], order: 12 },
            
            
            { text: "Як ви ставитесь до своїх щоденних обов'язків?", options: ["З ентузіазмом", "Нейтрально", "З небажанням", "З відразою"], points: [100, 70, 30, 5], order: 13 },
            { text: "Чи здається вам, що ваші зусилля марні?", options: ["Ніколи", "Іноді", "Часто", "Завжди"], points: [100, 70, 30, 10], order: 14 },
            { text: "Як швидко ви відновлюєте сили на вихідних?", options: ["Повністю", "Частково", "Дуже повільно", "Зовсім не відновлюю"], points: [100, 70, 40, 0], order: 15 }
        ];

        await Question.deleteMany({}); 
        const saved = await Question.insertMany(defaultQuestions);
        res.json({ message: "Diagnostic questions seeded successfully", count: saved.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
