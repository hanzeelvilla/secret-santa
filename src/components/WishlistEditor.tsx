"use client";

import { useActionState, useState } from "react";
import { addItem, deleteItem, updateItem } from "@/actions/wishlist";
import type { FormState } from "@/lib/validation";
import { SubmitButton } from "./buttons";

type Item = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
};

function firstError(state: FormState): string | undefined {
  if (!state) return undefined;
  if (state.error) return state.error;
  const fields = state.fieldErrors ?? {};
  return Object.values(fields).find((messages) => messages?.length)?.[0];
}

function ItemFields({ item }: { item?: Item }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <input
        name="title"
        className="input sm:col-span-2"
        placeholder="¿Qué te gustaría recibir?"
        aria-label="Deseo"
        defaultValue={item?.title}
        required
        maxLength={100}
      />
      <input
        name="url"
        type="url"
        className="input"
        placeholder="Enlace (opcional)"
        aria-label="Enlace"
        defaultValue={item?.url ?? ""}
        maxLength={500}
      />
      <input
        name="note"
        className="input"
        placeholder="Talla, color, detalles… (opcional)"
        aria-label="Nota"
        defaultValue={item?.note ?? ""}
        maxLength={200}
      />
    </div>
  );
}

function EditItem({ item, onDone }: { item: Item; onDone: () => void }) {
  const [error, setError] = useState<string>();

  async function action(formData: FormData) {
    const result = await updateItem(item.id, formData);
    const message = firstError(result);
    if (message) setError(message);
    else onDone();
  }

  return (
    <form action={action} className="space-y-2">
      <ItemFields item={item} />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <SubmitButton className="btn btn-primary px-4 py-1.5">
          Guardar
        </SubmitButton>
        <button
          type="button"
          className="btn btn-outline px-4 py-1.5"
          onClick={onDone}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function WishlistEditor({
  groupId,
  items,
}: {
  groupId: string;
  items: Item[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addState, addAction] = useActionState(
    addItem.bind(null, groupId),
    undefined,
  );
  const addError = firstError(addState);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-ink/60">
          Tu lista está vacía. Agrega algunas ideas para ayudar a tu amigo
          secreto. 🎅
        </p>
      ) : (
        <ul className="divide-y divide-pine/10">
          {items.map((item) => (
            <li key={item.id} className="py-3 first:pt-0">
              {editingId === item.id ? (
                <EditItem item={item} onDone={() => setEditingId(null)} />
              ) : (
                <div className="flex items-start gap-2">
                  <span aria-hidden="true">🎁</span>
                  <div className="min-w-0 flex-1">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold break-words text-berry underline underline-offset-2"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <span className="font-semibold break-words">
                        {item.title}
                      </span>
                    )}
                    {item.note && (
                      <p className="text-sm break-words text-ink/65">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      className="btn btn-outline border-0 px-3 py-1.5"
                      onClick={() => setEditingId(item.id)}
                    >
                      Editar
                    </button>
                    <form action={deleteItem.bind(null, item.id)}>
                      <SubmitButton className="btn btn-danger" pendingText="…">
                        Quitar
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={addAction} className="space-y-2 rounded-xl bg-pine/5 p-3">
        <ItemFields />
        {addError && (
          <p className="field-error" role="alert">
            {addError}
          </p>
        )}
        <SubmitButton className="btn btn-gold" pendingText="Agregando…">
          + Agregar a mi lista
        </SubmitButton>
      </form>
    </div>
  );
}
