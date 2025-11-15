import { useEffect, useState } from 'react'
import { api } from '../api/endpoints.js'
import { DELIVERY_STATUSES } from '../constants.js'
import DeliveryDetails from '../components/deliveries/DeliveryDetails.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { formatDate, formatTime } from '../utils/format.js'

export default function CourierDeliveriesPage() {
  const { token } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    date_from: '',
    date_to: ''
  })
  const [filterForm, setFilterForm] = useState(filters)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  const loadDeliveries = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.courier.list(token, filters)
      setDeliveries(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token])

  const applyFilters = (event) => {
    event.preventDefault()
    setFilters(filterForm)
  }

  const clearFilters = () => {
    const empty = { date: '', status: '', date_from: '', date_to: '' }
    setFilterForm(empty)
    setFilters(empty)
  }

  const openDelivery = async (deliveryId) => {
    setDetailLoading(true)
    setDetailError(null)
    try {
      const detail = await api.courier.get(token, deliveryId)
      setSelectedDelivery(detail)
    } catch (err) {
      setDetailError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="grid two">
      <section className="card">
        <form className="filter-row" onSubmit={applyFilters}>
          <div>
            <label>Дата</label>
            <input
              type="date"
              value={filterForm.date}
              onChange={(event) =>
                setFilterForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </div>
          <div>
            <label>Статус</label>
            <select
              value={filterForm.status}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  status: event.target.value
                }))
              }
            >
              <option value="">Все</option>
              {DELIVERY_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Период с</label>
            <input
              type="date"
              value={filterForm.date_from}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  date_from: event.target.value
                }))
              }
            />
          </div>
          <div>
            <label>по</label>
            <input
              type="date"
              value={filterForm.date_to}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  date_to: event.target.value
                }))
              }
            />
          </div>
          <div className="filter-actions">
            <button className="btn" type="button" onClick={clearFilters}>
              Сбросить
            </button>
            <button className="btn primary">Применить</button>
          </div>
        </form>

        {loading ? (
          <p className="muted">Загрузка...</p>
        ) : error ? (
          <div className="alert danger">{error}</div>
        ) : (
          <div className="courier-list">
            {deliveries.map((delivery) => (
              <article key={delivery.id} className="courier-card">
                <div>
                  <strong>{delivery.deliveryNumber}</strong>
                  <p className="muted">{formatDate(delivery.deliveryDate)}</p>
                </div>
                <p>
                  {formatTime(delivery.timeStart)} — {formatTime(delivery.timeEnd)}
                </p>
                <p className="muted">
                  Машина: {delivery.vehicle.brand} ({delivery.vehicle.licensePlate})
                </p>
                <div className="card-footer">
                  <span className={`tag ${delivery.status}`}>{delivery.status}</span>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => openDelivery(delivery.id)}
                  >
                    Открыть
                  </button>
                </div>
              </article>
            ))}
            {deliveries.length === 0 && (
              <p className="muted">Нет доставок по заданным условиям</p>
            )}
          </div>
        )}
      </section>
      <section className="card">
        {detailLoading && <p className="muted">Загрузка деталей...</p>}
        {detailError && <div className="alert danger">{detailError}</div>}
        {!selectedDelivery && !detailLoading && (
          <p className="muted">Выберите доставку слева, чтобы увидеть детали</p>
        )}
        {selectedDelivery && !detailLoading && (
          <DeliveryDetails
            delivery={selectedDelivery}
            onClose={() => setSelectedDelivery(null)}
          />
        )}
      </section>
    </div>
  )
}
