import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import '../../../styles/CreateForm.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';

const CreateForm = ({
  fields = [],
  onSubmit,
  buttonLabel = 'Create',
  initialValues = {},
  onCancel,
  title = 'Create New',
  onChange
}) => {
  const [form, setForm] = useState(initialValues);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fields.forEach(field => {
      if (field.type === 'geo' && !form[field.name]) {
        setForm(prev => ({
          ...prev,
          [field.name]: { latitude: '', longitude: '' }
        }));
      }
    });
  }, [fields, form]);

  const handleChange = (e) => {
    const { type, name, checked, value } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateChange = (date, name) => {
    if (date) {
      // Simple conversion to local ISO format
      const localISOString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, -1);

      setForm({
        ...form,
        [name]: localISOString
      });
    } else {
      setForm({
        ...form,
        [name]: ''
      });
    }
  };

  const handleGeoChange = (e, coord) => {
    setForm({
      ...form,
      [e.target.name]: {
        ...form[e.target.name],
        [coord]: e.target.value
      }
    });
  };

  const handleAddressChange = (e, key) => {
    setForm({
      ...form,
      [e.target.name]: {
        ...form[e.target.name],
        [key]: e.target.value
      }
    });
  };

  const handleLocationSelect = (fieldName, lat, lng) => {
    setForm({
      ...form,
      [fieldName]: {
        latitude: lat,
        longitude: lng
      }
    });
    setShowMap(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedForm = { ...form };
    fields.forEach(field => {
      if (field.type === 'number') {
        if (parsedForm[field.name] !== undefined && parsedForm[field.name] !== '') {
          parsedForm[field.name] = Number(parsedForm[field.name]);
        }
      } else if (field.type === 'tenure') {
        if (parsedForm[field.name]) {
          parsedForm[field.name] = {
            min: parsedForm[field.name].min !== undefined && parsedForm[field.name].min !== '' ? Number(parsedForm[field.name].min) : '',
            max: parsedForm[field.name].max !== undefined && parsedForm[field.name].max !== '' ? Number(parsedForm[field.name].max) : ''
          };
        }
      }
    });
    if (parsedForm.address) {
      parsedForm.address = {
        ...parsedForm.address,
        addressLine_1: parsedForm.address.addressLine_1 || '',
        addressLine_2: parsedForm.address.addressLine_2 || '',
        addressLine_3: parsedForm.address.addressLine_3 || '',
      };
    }
    onSubmit(parsedForm);
  };

  const groupedFields = [];
  for (let i = 0; i < fields.length; i += 2) {
    groupedFields.push(fields.slice(i, i + 2));
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {onCancel && (
            <button className="close-button" onClick={onCancel}>
              <FiX size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-fields">
            {groupedFields.map((fieldPair, index) => (
              <div key={index} className="form-row">
                {fieldPair.map(field => (
                  <div key={field.name} className="form-group">
                    <label className="form-label">
                      {field.label}
                      {field.required && <span className="required-asterisk">*</span>}
                    </label>
                    {field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={!!form[field.name]}
                        onChange={handleChange}
                        required={field.required}
                        className="form-checkbox"
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        name={field.name}
                        value={field.options?.find(option => option.value === form[field.name]) || null}
                        onChange={(selectedOption) => {
                          const e = {
                            target: {
                              name: field.name,
                              value: selectedOption?.value || ''
                            }
                          };
                          handleChange(e);
                          if (field.onChange) field.onChange(e);
                        }}
                        options={field.options}
                        isSearchable={true}
                        placeholder="Select..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                        required={field.required}
                        noOptionsMessage={() => "No options found"}
                        isClearable={true}
                      />
                    )  : field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        className="form-input"
                      />
                    ) : field.type === 'date' ? (
                        <DatePicker
                            key={form[field.name] ? form[field.name].toString() : "empty"} // Force re-render when value changes
                            selected={form[field.name] ? new Date(form[field.name]) : null}
                            onChange={date => handleDateChange(date, field.name)}
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            showTimeSelect
                            timeFormat="HH:mm:ss"
                            timeIntervals={1}
                            timeCaption="Time"
                            className="form-input"
                            placeholderText="Select date and time"
                            required={field.required}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            isClearable={true}
                        />
                    ) : field.type === 'tenure' ? (
                      <div className="tenure-fields">
                        <input
                          type="number"
                          name={field.name}
                          placeholder="Min"
                          value={form[field.name]?.min || ''}
                          onChange={e => handleAddressChange(e, 'min')}
                          required={field.required}
                          className="form-input"
                        />
                        <input
                          type="number"
                          name={field.name}
                          placeholder="Max"
                          value={form[field.name]?.max || ''}
                          onChange={e => handleAddressChange(e, 'max')}
                          required={field.required}
                          className="form-input"
                        />
                      </div>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        name={field.name}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        className="form-input"
                      />
                    ) : field.type === 'address' ? (
                      <div className="address-fields-grid">
                        <input
                          type="text"
                          name={field.name}
                          placeholder="House No."
                          value={form[field.name]?.houseNumber || ''}
                          onChange={e => handleGeoChange(e, 'houseNumber')}
                          required={field.required}
                          className="form-input"
                        />
                        <input
                          type="text"
                          name={field.name}
                          placeholder="Street"
                          value={form[field.name]?.street || ''}
                          onChange={e => handleGeoChange(e, 'street')}
                          required={field.required}
                          className="form-input"
                        />
                        <input
                          type="text"
                          name={field.name}
                          placeholder="City"
                          value={form[field.name]?.city || ''}
                          onChange={e => handleGeoChange(e, 'city')}
                          required={field.required}
                          className="form-input"
                        />
                        <input
                          type="text"
                          name={field.name}
                          placeholder="Address Line 1"
                          value={form[field.name]?.addressLine_1 || ''}
                          onChange={e => handleGeoChange(e, 'addressLine_1')}
                          className="form-input"
                        />
                        <input
                          type="text"
                          name={field.name}
                          placeholder="Address Line 2"
                          value={form[field.name]?.addressLine_2 || ''}
                          onChange={e => handleGeoChange(e, 'addressLine_2')}
                          className="form-input"
                        />
                        <input
                          type="text"
                          name={field.name}
                          placeholder="Address Line 3"
                          value={form[field.name]?.addressLine_3 || ''}
                          onChange={e => handleGeoChange(e, 'addressLine_3')}
                          className="form-input"
                        />
                      </div>
                    ) : field.type === 'geo' ? (
                      <div className="geo-fields">
                        <div className="geo-inputs">
                          <input
                            type="number"
                            name={field.name}
                            placeholder="Latitude"
                            value={form[field.name]?.latitude || ''}
                            onChange={e => handleGeoChange(e, 'latitude')}
                            required={field.required}
                            className="form-input"
                            readOnly
                          />
                          <input
                            type="number"
                            name={field.name}
                            placeholder="Longitude"
                            value={form[field.name]?.longitude || ''}
                            onChange={e => handleGeoChange(e, 'longitude')}
                            required={field.required}
                            className="form-input"
                            readOnly
                          />
                        </div>
                        <button 
                          type="button" 
                          className="map-picker-button"
                          onClick={() => setShowMap(field.name)}
                        >
                          Pick Location on Map
                        </button>
                        {showMap === field.name && (
                          <div className="map-modal">
                            <div className="map-container">

                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={form[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        className="form-input"
                      />
                    )}
                  </div>
                ))}
                {fieldPair.length === 1 && <div className="form-group empty"></div>}
              </div>
            ))}
          </div>

          <div className="form-actions">
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                className="cancel-button"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="submit-button">
              {buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForm;