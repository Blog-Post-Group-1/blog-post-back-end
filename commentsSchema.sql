DROP TABLE IF EXISTS Comments;

CREATE TABLE IF NOT EXISTS Comments(
    commentId SERIAL ,
    postId SERIAL NOT NULL,
    userId SERIAL NOT NULL,
    Content  TEXT NOT NULL,
    Created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY(commentId ),
    CONSTRAINT fk_post FOREIGN KEY(postId) REFERENCES Posts(postId),
    CONSTRAINT fk_user FOREIGN KEY(userId) REFERENCES Users(userId)
);