import React, { useState, useEffect } from "react";
import api from "../../api";
import { Link } from "react-router-dom";

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    api
      .get("/knowledge")
      .then((res) => setArticles(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Knowledge Base</h2>
      <ul>
        {articles.map((article) => (
          <li key={article._id}>
            <Link to={`/knowledge-base/${article._id}`}>{article.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KnowledgeBase;
