"use client";

export function DeleteInvitationButton({ action }: { action: () => void }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm("この招待状と関連するすべてのデータ、アップロード画像を削除します。元に戻せません。")) event.preventDefault(); }}><button className="delete-button">削除</button></form>;
}
