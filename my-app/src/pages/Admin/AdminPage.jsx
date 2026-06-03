import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminMaterials from "./AdminMaterials";
import AdminScenarios from "./AdminScenarios";
import "./adminPage.css";

export default function AdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("content"); 

    return (
        <div className="dr-admin-layout">
            <aside className="dr-admin-sidebar">
                <div className="dr-admin-logo">
                    <span className="dr-logo-icon">🛡️</span>
                    <span className="dr-logo-text">Admin Panel</span>
                </div>

                <nav className="dr-admin-nav">
                    <button
                        className={activeTab === "content" ? "active" : ""}
                        onClick={() => setActiveTab("content")}
                    >
                        <span className="dr-nav-icon">📚</span>
                        <span className="dr-nav-label">Бібліотека</span>
                    </button>

                    <button
                        className={activeTab === "scenarios" ? "active" : ""}
                        onClick={() => setActiveTab("scenarios")}
                    >
                        <span className="dr-nav-icon">🎮</span>
                        <span className="dr-nav-label">Тренажери</span>
                    </button>
                </nav>

                <div className="dr-sidebar-footer">
                    <button className="dr-admin-exit" onClick={() => navigate("/main")}>
                        <span className="dr-exit-icon">🚪</span>
                        <span className="dr-exit-label">Вихід</span>
                    </button>
                </div>
            </aside>

            <main className="dr-admin-main">
                {activeTab === "content" ? (
                    <AdminMaterials />
                ) : (
                    <AdminScenarios />
                )}
            </main>
        </div>
    );
}