import { useEffect, useState } from 'react'
import { api } from '../api/endpoints.js'
import { useAuth } from '../state/AuthContext.jsx'

const emptyVehicle = {
  brand: '',
  licensePlate: '',
  maxWeight: '',
  maxVolume: ''
}

export default function VehiclesPage() {
  const { token } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyVehicle)
  const [editingVehicle, setEditingVehicle] = useState(null)

  const loadVehicles = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.vehicles.list(token)
      setVehicles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const startEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setForm({
      brand: vehicle.brand,
      licensePlate: vehicle.licensePlate,
      maxWeight: vehicle.maxWeight,
      maxVolume: vehicle.maxVolume
    })
  }

  const resetForm = () => {
    setEditingVehicle(null)
    setForm(emptyVehicle)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        ...form,
        maxWeight: Number(form.maxWeight),
        maxVolume: Number(form.maxVolume)
      }

      if (editingVehicle) {
        await api.vehicles.update(token, editingVehicle.id, payload)
      } else {
        await api.vehicles.create(token, payload)
      }
      resetForm()
      await loadVehicles()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (vehicle) => {
    const confirmed = window.confirm(`Удалить машину ${vehicle.licensePlate}?`)
    if (!confirmed) return
    try {
      await api.vehicles.delete(token, vehicle.id)
      await loadVehicles()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="grid two">
      <section className="card">
        <h2>Машины</h2>
        {loading ? (
          <p className="muted">Загрузка...</p>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Марка</th>
                  <th>Номер</th>
                  <th>Макс. вес (кг)</th>
                  <th>Макс. объем (м³)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.brand}</td>
                    <td>{vehicle.licensePlate}</td>
                    <td>{vehicle.maxWeight}</td>
                    <td>{vehicle.maxVolume}</td>
                    <td className="table-actions">
                      <button className="btn ghost" onClick={() => startEdit(vehicle)}>
                        Изменить
                      </button>
                      <button
                        className="btn ghost danger"
                        onClick={() => handleDelete(vehicle)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      Нет машин
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="card">
        <div className="section-head">
          <h2>{editingVehicle ? 'Редактировать машину' : 'Новая машина'}</h2>
          {editingVehicle && (
            <button className="btn ghost" onClick={resetForm}>
              Сбросить
            </button>
          )}
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Марка</span>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Номер</span>
            <input
              name="licensePlate"
              value={form.licensePlate}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Максимальный вес (кг)</span>
            <input
              name="maxWeight"
              type="number"
              min="0"
              step="0.1"
              value={form.maxWeight}
              onChange={handleChange}
              required
            />
          </label>
          <label className="form-field">
            <span>Максимальный объем (м³)</span>
            <input
              name="maxVolume"
              type="number"
              min="0"
              step="0.1"
              value={form.maxVolume}
              onChange={handleChange}
              required
            />
          </label>
          <button className="btn primary" type="submit">
            {editingVehicle ? 'Сохранить' : 'Создать'}
          </button>
        </form>
      </section>
    </div>
  )
}
