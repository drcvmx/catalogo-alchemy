import { useNavigate } from "react-router-dom";
import { ZONES } from "@/config/zones";

const DevSwitcher = () => {
    const navigate = useNavigate();

    // NOTE: In a real scenario, you might hide this in production.
    // For this demo, we keep it visible to allow easy navigation.
    // if (!import.meta.env.DEV) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-black/90 p-3 rounded-lg border border-white/20 text-white shadow-xl backdrop-blur-sm">
            <p className="text-xs font-bold mb-2 text-center text-white/50">🔧 ZONES (DEMO)</p>

            <div className="grid grid-cols-2 gap-2">
                {ZONES.map(zone => (
                    <button
                        key={zone.slug}
                        onClick={() => navigate(`/${zone.slug}`)}
                        className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/10 truncate transition-colors"
                        title={zone.name}
                    >
                        {zone.name}
                    </button>
                ))}
                <button
                    onClick={() => navigate(`/admin`)}
                    className="col-span-2 text-xs px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded border border-yellow-500/30 text-yellow-200 font-semibold mt-1 transition-colors"
                >
                    Admin Panel
                </button>
            </div>
        </div>
    );
};

export default DevSwitcher;
