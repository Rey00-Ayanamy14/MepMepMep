import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/endpoints.js'
import { DELIVERY_STATUSES } from '../constants.js'
import DeliveryDetails from '../components/deliveries/DeliveryDetails.jsx'
import { useAuth } from '../state/AuthContext.jsx'
import { formatDate } from '../utils/format.js'

const createPoint = (index = 1) => ({
  sequence: index,
  latitude: '',
  longitude: '',
  products: [{ productId: '', quantity: 1 }]
})

const initialForm = {
  courierId: '',
  vehicleId: '',
  deliveryDate: '',
  timeStart: '09:00',
  timeEnd: '18:00',
  points: [createPoint(1)]
}

const sampleGenerationPayload = `{
  "2025-01-30": [
    {
      "route": [
        {"sequence": 1, "latitude": 55.75, "longitude": 37.61},
        {"sequence": 2, "latitude": 55.78, "longitude": 37.65}
      ],
      "products": [
        {"productId": 1, "quantity": 5}
      ]
    }
  ]
}`

const sampleRoutePoints = `[
  {"latitude": 55.75, "longitude": 37.61},
  {"latitude": 55.78, "longitude": 37.65}
]`

export default function DeliveriesPage() {
  const { token } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [couriers, setCouriers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [products, setProducts] = useState([])
  const [refsError, setRefsError] = useState(null)

  const [filters, setFilters] = useState({
    date: '',
    courier_id: '',
    status: ''
  })
  const [filterForm, setFilterForm] = useState(filters)

  const [form, setForm] = useState(initialForm)
  const [editingDelivery, setEditingDelivery] = useState(null)
  const [formError, setFormError] = useState(null)

  const [selectedDelivery, setSelectedDelivery] = useState(null)

  const [generationInput, setGenerationInput] = useState(
    sampleGenerationPayload
  )
  const [generationResult, setGenerationResult] = useState(null)
  const [generationError, setGenerationError] = useState(null)

  const [routePointsInput, setRoutePointsInput] = useState(sampleRoutePoints)
  const [routeResult, setRouteResult] = useState(null)
  const [routeError, setRouteError] = useState(null)
  const [calculatingRoute, setCalculatingRoute] = useState(false)

  const loadReferences = async () => {
    const errors = []
    const [courierRes, vehicleRes, productRes] = await Promise.allSettled([
      api.users.list(token, 'courier'),
      api.vehicles.list(token),
      api.products.list(token)
    ])

    if (courierRes.status === 'fulfilled') {
      setCouriers(courierRes.value)
    } else {
      setCouriers([])
      errors.push(
        'Не удалось загрузить список курьеров (нужны права администратора)'
      )
    }

    if (vehicleRes.status === 'fulfilled') {
      setVehicles(vehicleRes.value)
    } else {
      errors.push(vehicleRes.reason.message)
    }

    if (productRes.status === 'fulfilled') {
      setProducts(productRes.value)
    } else {
      errors.push(productRes.reason.message)
    }

    setRefsError(errors.length ? errors.join('. ') : null)
  }

  const loadDeliveries = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.deliveries.list(token, filters)
      setDeliveries(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReferences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    loadDeliveries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, token])

  const updateFormField = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const updatePointField = (index, field, value) => {
    setForm((prev) => {
      const points = [...prev.points]
      points[index] = { ...points[index], [field]: value }
      return { ...prev, points }
    })
  }

  const updatePointProduct = (pointIndex, productIndex, field, value) => {
    setForm((prev) => {
      const points = [...prev.points]
      const productsInPoint = [...points[pointIndex].products]
      productsInPoint[productIndex] = {
        ...productsInPoint[productIndex],
        [field]: value
      }
      points[pointIndex] = { ...points[pointIndex], products: productsInPoint }
      return { ...prev, points }
    })
  }

  const addPoint = () => {
    setForm((prev) => ({
      ...prev,
      points: [...prev.points, createPoint(prev.points.length + 1)]
    }))
  }

  const removePoint = (index) => {
    setForm((prev) => {
      if (prev.points.length === 1) return prev
      const points = prev.points.filter((_, idx) => idx !== index)
      return { ...prev, points }
    })
  }

  const addProductToPoint = (index) => {
    setForm((prev) => {
      const points = [...prev.points]
      points[index] = {
        ...points[index],
        products: [...points[index].products, { productId: '', quantity: 1 }]
      }
      return { ...prev, points }
    })
  }

  const removeProductFromPoint = (pointIndex, productIndex) => {
    setForm((prev) => {
      const points = [...prev.points]
      const productsInPoint = points[pointIndex].products.filter(
        (_, idx) => idx !== productIndex
      )
      points[pointIndex] = { ...points[pointIndex], products: productsInPoint }
      return { ...prev, points }
    })
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingDelivery(null)
    setFormError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    try {
      const payload = {
        courierId: Number(form.courierId),
        vehicleId: Number(form.vehicleId),
        deliveryDate: form.deliveryDate,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        points: form.points.map((point, idx) => ({
          sequence: Number(point.sequence || idx + 1),
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
          products: point.products
            .filter((product) => product.productId)
            .map((product) => ({
              productId: Number(product.productId),
              quantity: Number(product.quantity)
            }))
        }))
      }

      if (editingDelivery) {
        await api.deliveries.update(token, editingDelivery.id, payload)
      } else {
        await api.deliveries.create(token, payload)
      }
      resetForm()
      await loadDeliveries()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleDeleteDelivery = async (delivery) => {
    const confirmed = window.confirm(
      `Удалить доставку ${delivery.deliveryNumber}?`
    )
    if (!confirmed) return
    try {
      await api.deliveries.delete(token, delivery.id)
      await loadDeliveries()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditDelivery = (delivery) => {
    if (!delivery.canEdit) return
    setEditingDelivery(delivery)
    setForm({
      courierId: delivery.courier?.id || '',
      vehicleId: delivery.vehicle?.id || '',
      deliveryDate: delivery.deliveryDate,
      timeStart: delivery.timeStart,
      timeEnd: delivery.timeEnd,
      points: delivery.deliveryPoints.map((point) => ({
        sequence: point.sequence,
        latitude: point.latitude,
        longitude: point.longitude,
        products: point.products.map((product) => ({
          productId: product.product.id,
          quantity: product.quantity
        }))
      }))
    })
  }

  const applyFilters = (event) => {
    event.preventDefault()
    setFilters(filterForm)
  }

  const clearFilters = () => {
    setFilterForm({ date: '', courier_id: '', status: '' })
    setFilters({ date: '', courier_id: '', status: '' })
  }

  const handleGenerateDeliveries = async (event) => {
    event.preventDefault()
    setGenerationError(null)
    try {
      const parsed = JSON.parse(generationInput)
      const response = await api.deliveries.generate(token, {
        deliveryData: parsed
      })
      setGenerationResult(response)
      await loadDeliveries()
    } catch (err) {
      setGenerationError(err.message)
    }
  }

  const handleCalculateRoute = async (event) => {
    event.preventDefault()
    setRouteError(null)
    setRouteResult(null)
    try {
      const parsed = JSON.parse(routePointsInput)
      setCalculatingRoute(true)
      const response = await api.route.calculate(token, { points: parsed })
      setRouteResult(response)
    } catch (err) {
      setRouteError(err.message)
    } finally {
      setCalculatingRoute(false)
    }
  }

  const filteredDeliveries = useMemo(() => deliveries, [deliveries])

  return (
    <div className="deliveries-grid">
      <section className="card">
        <form className="filter-row" onSubmit={applyFilters}>
          <div>
            <label>Дата</label>
            <input
              type="date"
              value={filterForm.date}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  date: event.target.value
                }))
              }
            />
          </div>
          <div>
            <label>Курьер</label>
            <select
              value={filterForm.courier_id}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  courier_id: event.target.value
                }))
              }
            >
              <option value="">Все</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.name}
                </option>
              ))}
            </select>
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
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Дата</th>
                  <th>Курьер</th>
                  <th>Статус</th>
                  <th>Машина</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td>{delivery.deliveryNumber}</td>
                    <td>{formatDate(delivery.deliveryDate)}</td>
                    <td>{delivery.courier?.name || '—'}</td>
                    <td>
                      <span className={`tag ${delivery.status}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td>{delivery.vehicle?.licensePlate || '—'}</td>
                    <td className="table-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => setSelectedDelivery(delivery)}
                      >
                        Подробнее
                      </button>
                      {delivery.canEdit && (
                        <>
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() => handleEditDelivery(delivery)}
                          >
                            Редактировать
                          </button>
                          <button
                            className="btn ghost danger"
                            type="button"
                            onClick={() => handleDeleteDelivery(delivery)}
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      Доставки не найдены
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
          <h2>{editingDelivery ? 'Редактировать доставку' : 'Новая доставка'}</h2>
          {editingDelivery && (
            <button className="btn ghost" type="button" onClick={resetForm}>
              Отменить редактирование
            </button>
          )}
        </div>
        {formError && <div className="alert danger">{formError}</div>}
        {refsError && <div className="alert danger">{refsError}</div>}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Курьер</span>
            {couriers.length > 0 ? (
              <select
                name="courierId"
                value={form.courierId}
                onChange={updateFormField}
                required
              >
                <option value="" disabled>
                  Выберите курьера
                </option>
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                name="courierId"
                value={form.courierId}
                onChange={updateFormField}
                placeholder="Введите ID курьера"
                required
              />
            )}
          </label>
          <label className="form-field">
            <span>Машина</span>
            <select
              name="vehicleId"
              value={form.vehicleId}
              onChange={updateFormField}
              required
            >
              <option value="" disabled>
                Выберите машину
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} ({vehicle.licensePlate})
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Дата</span>
            <input
              type="date"
              name="deliveryDate"
              value={form.deliveryDate}
              onChange={updateFormField}
              required
            />
          </label>
          <label className="form-field">
            <span>Время начала</span>
            <input
              type="time"
              name="timeStart"
              value={form.timeStart}
              onChange={updateFormField}
              required
            />
          </label>
          <label className="form-field">
            <span>Время окончания</span>
            <input
              type="time"
              name="timeEnd"
              value={form.timeEnd}
              onChange={updateFormField}
              required
            />
          </label>

          <div className="points-section">
            <div className="section-head">
              <h3>Точки маршрута</h3>
              <button className="btn ghost" type="button" onClick={addPoint}>
                Добавить точку
              </button>
            </div>
            {form.points.map((point, index) => (
              <div key={index} className="point-card">
                <div className="point-card-head">
                  <strong>Точка {index + 1}</strong>
                  {form.points.length > 1 && (
                    <button
                      type="button"
                      className="btn ghost danger"
                      onClick={() => removePoint(index)}
                    >
                      Удалить
                    </button>
                  )}
                </div>
                <div className="point-grid">
                  <label className="form-field">
                    <span>Порядок</span>
                    <input
                      type="number"
                      min="1"
                      value={point.sequence}
                      onChange={(event) =>
                        updatePointField(index, 'sequence', event.target.value)
                      }
                    />
                  </label>
                  <label className="form-field">
                    <span>Широта</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={point.latitude}
                      onChange={(event) =>
                        updatePointField(index, 'latitude', event.target.value)
                      }
                      required
                    />
                  </label>
                  <label className="form-field">
                    <span>Долгота</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={point.longitude}
                      onChange={(event) =>
                        updatePointField(index, 'longitude', event.target.value)
                      }
                      required
                    />
                  </label>
                </div>
                <div className="products-block">
                  <div className="section-head">
                    <p>Товары</p>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => addProductToPoint(index)}
                    >
                      Добавить товар
                    </button>
                  </div>
                  {point.products.map((product, productIndex) => (
                    <div key={productIndex} className="product-row">
                      <select
                        value={product.productId}
                        onChange={(event) =>
                          updatePointProduct(
                            index,
                            productIndex,
                            'productId',
                            event.target.value
                          )
                        }
                      >
                        <option value="">Выберите товар</option>
                        {products.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(event) =>
                          updatePointProduct(
                            index,
                            productIndex,
                            'quantity',
                            event.target.value
                          )
                        }
                      />
                      <button
                        type="button"
                        className="btn ghost danger"
                        onClick={() =>
                          removeProductFromPoint(index, productIndex)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {point.products.length === 0 && (
                    <p className="muted">Добавьте товары для этой точки</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="btn primary" type="submit">
            {editingDelivery ? 'Сохранить изменения' : 'Создать доставку'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Массовая генерация</h2>
        </div>
        <p className="muted">
          Введите JSON по схеме эндпоинта `/deliveries/generate`. Сервис
          автоматически распределит курьеров и машины.
        </p>
        {generationError && <div className="alert danger">{generationError}</div>}
        <form className="form-grid" onSubmit={handleGenerateDeliveries}>
          <textarea
            rows={8}
            value={generationInput}
            onChange={(event) => setGenerationInput(event.target.value)}
          />
          <button className="btn primary">Запустить генерацию</button>
        </form>
        {generationResult && (
          <div className="alert success">
            Создано доставок: {generationResult.totalGenerated}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Расчет маршрута</h2>
        </div>
        <p className="muted">
          Быстрая проверка времени прохождения точки маршрута через эндпоинт
          `/routes/calculate`.
        </p>
        {routeError && <div className="alert danger">{routeError}</div>}
        <form className="form-grid" onSubmit={handleCalculateRoute}>
          <textarea
            rows={6}
            value={routePointsInput}
            onChange={(event) => setRoutePointsInput(event.target.value)}
          />
          <button className="btn primary" disabled={calculatingRoute}>
            {calculatingRoute ? 'Расчет...' : 'Рассчитать'}
          </button>
        </form>
        {routeResult && (
          <div className="list">
            <div>
              <strong>Расстояние</strong>
              <p className="muted">{routeResult.distanceKm} км</p>
            </div>
            <div>
              <strong>Время в пути</strong>
              <p className="muted">{routeResult.durationMinutes} мин</p>
            </div>
            {routeResult.suggestedTime && (
              <div>
                <strong>Рекомендация</strong>
                <p className="muted">
                  {routeResult.suggestedTime.start} —{' '}
                  {routeResult.suggestedTime.end}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {selectedDelivery && (
        <div className="card">
          <DeliveryDetails
            delivery={selectedDelivery}
            onClose={() => setSelectedDelivery(null)}
          />
        </div>
      )}
    </div>
  )
}
