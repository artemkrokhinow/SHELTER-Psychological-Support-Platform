import { useState, useCallback, useEffect } from "react";
import { api } from "../../infrastructure/api/api";
import "./adminPage.css";

export default function AdminMaterials() {
    const [materials, setMaterials] = useState([]);
    const [viewMode, setViewMode] = useState("list");
    const [editId, setEditId] = useState(null);
    const [isJsonMode, setIsJsonMode] = useState(false);
    const [jsonInput, setJsonInput] = useState("");

    const [materialForm, setMaterialForm] = useState({
        title: "",
        desc: "",
        type: "text",
        icon: "📖",
        image: "",
        content: "",
        category: "general",
        duration: "5 хв",
    });

    const loadData = useCallback(async () => {
        try {
            const data = await api.getMaterials();
            if (Array.isArray(data)) {
                setMaterials(data);
            }
        } catch (error) {
            console.error("Error loading materials:", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEditMaterial = (item) => {
        setEditId(item._id);
        setMaterialForm({
            title: item.title,
            desc: item.desc,
            type: item.type,
            icon: item.icon,
            image: item.image || "",
            content: item.content || "",
            category: item.category || "general",
            duration: item.duration || "5 хв",
        });
        setJsonInput(JSON.stringify(item, null, 4));
        setViewMode("create");
    };

    const resetForms = () => {
        setEditId(null);
        setIsJsonMode(false);
        setJsonInput("");
        setMaterialForm({
            title: "",
            desc: "",
            type: "text",
            icon: "📖",
            image: "",
            content: "",
            category: "general",
            duration: "5 хв",
        });
        setViewMode("list");
    };

    const handleSaveMaterial = async (e) => {
        e.preventDefault();
        try {
            let payload = isJsonMode ? JSON.parse(jsonInput) : materialForm;
            const res = editId
                ? await api.updateMaterial(editId, payload)
                : await api.createMaterial(payload);
            
            if (res && !res.error) {
                alert("Успішно збережено!");
                resetForms();
                loadData();
            }
        } catch (err) {
            alert("Помилка збереження");
        }
    };

    if (viewMode === "list") {
        return (
            <div className="dr-admin-content-wrapper">
                <div className="dr-admin-header-row">
                    <h1>Бібліотека знань</h1>
                    <button className="dr-create-btn" onClick={() => setViewMode("create")}>➕ Створити</button>
                </div>
                <div className="dr-admin-table">
                    <div className="dr-table-header">
                        <div>Назва</div>
                        <div>Тип</div>
                        <div>Дії</div>
                    </div>
                    {materials.map((item) => (
                        <div key={item._id} className="dr-table-row">
                            <div className="dr-table-cell">{item.title}</div>
                            <div className="dr-table-cell">{item.type}</div>
                            <div className="dr-table-cell dr-actions">
                                <button className="dr-edit-btn" onClick={() => handleEditMaterial(item)}>✏️</button>
                                <button className="dr-delete-btn" onClick={async () => {
                                    if (window.confirm("Видалити?")) {
                                        await api.deleteMaterial(item._id);
                                        loadData();
                                    }
                                }}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="dr-admin-content-wrapper">
            <div className="dr-admin-header-row">
                <h1>{editId ? "Редагувати" : "Створити"} матеріал</h1>
                <button className="dr-back-btn" onClick={resetForms}>Назад</button>
            </div>
            <form onSubmit={handleSaveMaterial} className="dr-material-form">
                <div className="dr-form-grid">
                    <div className="dr-input-group full">
                        <label>Назва</label>
                        <input type="text" value={materialForm.title} onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})} required />
                    </div>
                    <div className="dr-input-group">
                        <label>Тип</label>
                        <select value={materialForm.type} onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}>
                            <option value="text">Текст</option>
                            <option value="video">Відео</option>
                            <option value="audio">Аудіо</option>
                        </select>
                    </div>
                    <div className="dr-input-group full">
                        <label>Контент (HTML)</label>
                        <textarea value={materialForm.content} onChange={(e) => setMaterialForm({...materialForm, content: e.target.value})} rows={10} />
                    </div>
                </div>
                <button type="submit" className="dr-save-btn">Зберегти</button>
            </form>
        </div>
    );
}