ALTER TABLE "Invitation"
ADD COLUMN "groomMessage" TEXT NOT NULL DEFAULT 'この特別な日を、大切な皆様とともに迎えられることを心より嬉しく思います。素敵な一日にしましょう。',
ADD COLUMN "brideMessage" TEXT NOT NULL DEFAULT '温かいご祝福の中で、新しい門出を迎えられることを幸せに思います。どうぞよろしくお願いいたします。';
