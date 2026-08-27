import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { categoryApi } from "../../api/categories";
import type { Category } from "../../types/category";
import { tr } from "../../i18n/translations";
import SubscriptionModal from "../subscription/SubscriptionModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  /** 추가·삭제 후 목록을 다시 읽도록 알린다 */
  onChanged: () => void;
}

// 이모지 입력을 요구하면 대부분 비워 두고 넘어간다. 자주 쓰는 것만 눌러 고르게 한다.
const ICONS = ["🏷️", "🏋️", "🍽️", "🚗", "🏠", "🐾", "🎨", "✈️", "💊", "📦"];
const COLORS = ["#64748B", "#2563EB", "#16A34A", "#D97706", "#DC2626", "#7C3AED"];

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onChanged,
}: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const mine = categories.filter((c) => c.is_custom);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await categoryApi.create({ name: trimmed, icon, color });
      toast.success(tr("카테고리를 추가했습니다."));
      setName("");
      onChanged();
    } catch (err) {
      // 400은 이름이 겹칠 때뿐이라 그대로 알려 주는 편이 친절하다
      const status = (err as { response?: { status?: number } }).response?.status;
      toast.error(
        status === 400
          ? tr("같은 이름의 카테고리가 이미 있습니다.")
          : tr("카테고리 추가에 실패했습니다.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setSaving(true);
    try {
      await categoryApi.remove(category.id);
      toast.success(tr("카테고리를 삭제했습니다."));
      onChanged();
    } catch {
      toast.error(tr("카테고리 삭제에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubscriptionModal isOpen={isOpen} onClose={onClose} title={tr("카테고리 추가")}>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-500">{tr("이름 *")}</label>
          <input
            type="text"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder={tr("예: 운동, 반려동물")}
            className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500">{tr("아이콘")}</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`h-9 w-9 rounded-lg text-lg transition-colors ${
                  icon === emoji ? "bg-blue-600 text-white" : "glass"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-500">{tr("색")}</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                aria-label={hex}
                style={{ backgroundColor: hex }}
                className={`h-9 w-9 rounded-lg border-2 transition-transform ${
                  color === hex ? "scale-110 border-slate-900" : "border-transparent"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary-glass px-4 py-2 text-sm font-medium"
          >
            {tr("닫기")}
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="btn-primary-glass px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? tr("저장 중...") : tr("추가")}
          </button>
        </div>
      </form>

      {/* 만든 카테고리를 지울 곳이 따로 없으면 오타 하나를 영영 안고 간다 */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-slate-500">{tr("내가 만든 카테고리")}</p>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">{tr("아직 없습니다.")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {mine.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
                  style={{ backgroundColor: c.color ?? "#E5E7EB" }}
                >
                  {c.icon ?? ""}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{c.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  disabled={saving}
                  aria-label={tr("삭제")}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-400">
          {tr("카테고리를 지워도 구독 기록은 남고 분류만 없어집니다.")}
        </p>
      </div>
    </SubscriptionModal>
  );
}
