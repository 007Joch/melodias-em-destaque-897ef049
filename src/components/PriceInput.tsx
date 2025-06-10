
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { processMonetaryValue } from '@/services/versesService';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

const PriceInput = ({ value, onChange, placeholder = "0,00", className }: PriceInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formatar valor para exibição
  const formatForDisplay = (val: number) => {
    if (val === 0) return '';
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Atualizar o valor de exibição quando o valor prop mudar
  useEffect(() => {
    setDisplayValue(formatForDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Processar o valor e notificar o componente pai
    const processedValue = processMonetaryValue(inputValue);
    onChange(processedValue);
  };

  const handleBlur = () => {
    // Reformatar o valor ao sair do campo
    const processedValue = processMonetaryValue(displayValue);
    setDisplayValue(formatForDisplay(processedValue));
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
        R$
      </span>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
      />
    </div>
  );
};

export default PriceInput;
