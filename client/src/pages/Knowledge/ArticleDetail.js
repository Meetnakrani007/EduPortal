import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    api
      .get(`/knowledge/${id}`)
      .then((res) => setArticle(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!article) return <div>Loading...</div>;

  return (
    <div>
      <h2>{article.title}</h2>
      <p>{article.content}</p>
    </div>
  );
};

export default ArticleDetail;
