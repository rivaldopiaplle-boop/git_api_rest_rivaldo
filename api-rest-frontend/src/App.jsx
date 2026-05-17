import React, { useEffect, useState } from "react";
import "./App.css";
import api from "./api";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  async function fetchFoods() {
    setLoading(true);
    try {
      const res = await api.get("/foods");
      setFoods(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load foods");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFoods();
  }, []);

  async function onSubmit(values) {
    try {
      const res = await api.post("/foods", values);
      toast.success("Aliment ajouté");
      setFoods((prev) => [...prev, res.data.data]);
      reset();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "Erreur lors de la création";
      toast.error(msg);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer cet aliment ?")) return;
    try {
      await api.delete(`/foods/${id}`);
      setFoods((prev) => prev.filter((f) => f.id !== id));
      toast.success("Supprimé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur suppression");
    }
  }

  return (
    <div className="app">
      <Toaster />
      <h1>Liste des aliments</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="food-form">
        <input placeholder="Name" {...register("name")} />
        <input placeholder="Category" {...register("category")} />
        <input placeholder="Calories" type="number" {...register("calories")} />
        <button type="submit">Ajouter</button>
      </form>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {foods.map((f) => (
            <li key={f.id}>
              <strong>{f.name}</strong> — {f.category}
              {f.apiKey ? (
                <div className="apikey">API key: {f.apiKey}</div>
              ) : null}
              <button onClick={() => handleDelete(f.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
