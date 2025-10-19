import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Settings, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const InvestmentDashboard = () => {
  const [showInputs, setShowInputs] = useState(true);
  const [inputs, setInputs] = useState({
    initialInvestment: 6000000,
    houses: 4,
    monthlyRentPerHouse: 6500,
    monthlyMaintenance: 1000,
    rentInflationRate: 6,
    bondRate: 7.5,
    bondMaturity: 10,
    fdRate: 6.5,
    fdCompounding: false,
    years: 30
  });

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const data = useMemo(() => {
    const {
      initialInvestment,
      houses,
      monthlyRentPerHouse,
      monthlyMaintenance,
      rentInflationRate,
      bondRate,
      bondMaturity,
      fdRate,
      fdCompounding,
      years
    } = inputs;

    const annualRentYear1 = houses * monthlyRentPerHouse * 12;
    const annualMaintenance = monthlyMaintenance * 12;
    const netRentYear1 = annualRentYear1 - annualMaintenance;

    let rent = netRentYear1;
    let cumRent = 0;
    let cumBond = 0;
    let cumFd = 0;
    let fdPrincipal = initialInvestment;

    const results = [];

    for (let year = 1; year <= years; year++) {
      cumRent += rent;
      const rentProfit = cumRent - initialInvestment;
      const rentBreakEven = cumRent >= initialInvestment;

      let bondEarn = 0;
      if (year <= bondMaturity) {
        bondEarn = initialInvestment * (bondRate / 100);
      }
      if (year === bondMaturity) {
        bondEarn += initialInvestment;
      }
      cumBond += bondEarn;
      
      // Bond profit: Before maturity, only interest earned (no loss since principal is safe)
      // After maturity, total returns minus initial investment
      let bondProfit;
      if (year < bondMaturity) {
        bondProfit = cumBond; // Only interest earned so far
      } else {
        bondProfit = cumBond - initialInvestment; // After maturity, actual profit
      }
      const bondBreakEven = bondProfit >= 0;

      let fdEarn = 0;
      if (fdCompounding) {
        fdPrincipal *= (1 + fdRate / 100);
        fdEarn = fdPrincipal - (year === 1 ? initialInvestment : cumFd);
        cumFd = fdPrincipal;
      } else {
        fdEarn = initialInvestment * (fdRate / 100);
        cumFd += fdEarn;
      }
      
      // FD profit: Principal is safe, so profit is only interest earned
      // We show cumulative interest as profit since principal will be returned
      const fdProfit = fdCompounding ? (cumFd - initialInvestment) : cumFd;
      const fdBreakEven = fdProfit >= 0;

      results.push({
        year,
        rentIncome: Math.round(rent),
        rentCumulative: Math.round(cumRent),
        rentProfit: Math.round(rentProfit),
        rentBreakEven,
        bondIncome: Math.round(bondEarn),
        bondCumulative: Math.round(cumBond),
        bondProfit: Math.round(bondProfit),
        bondBreakEven,
        fdIncome: Math.round(fdEarn),
        fdCumulative: Math.round(cumFd),
        fdProfit: Math.round(fdProfit),
        fdBreakEven
      });

      rent *= (1 + rentInflationRate / 100);
    }

    return results;
  }, [inputs]);

  const breakEvenYears = useMemo(() => {
    return {
      rent: data.find(d => d.rentBreakEven)?.year || 'Never',
      bond: data.find(d => d.bondBreakEven)?.year || 'Never',
      fd: data.find(d => d.fdBreakEven)?.year || 'Never'
    };
  }, [data]);

  const finalYearData = useMemo(() => {
    const final = data[data.length - 1];
    return {
      rent: {
        cumulative: final.rentCumulative,
        profit: final.rentProfit,
        roi: ((final.rentProfit / inputs.initialInvestment) * 100).toFixed(2)
      },
      bond: {
        cumulative: final.bondCumulative,
        profit: final.bondProfit,
        roi: ((final.bondProfit / inputs.initialInvestment) * 100).toFixed(2)
      },
      fd: {
        cumulative: final.fdCumulative,
        profit: final.fdProfit,
        roi: ((final.fdProfit / inputs.initialInvestment) * 100).toFixed(2)
      }
    };
  }, [data, inputs.initialInvestment]);

  const formatCurrency = (value) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 0) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else {
      return `-₹${(Math.abs(value) / 100000).toFixed(2)}L`;
    }
  };

  const [selectedView, setSelectedView] = useState('profit');
  const [showTable, setShowTable] = useState(true);

  const exportToCSV = () => {
    const headers = ['Year', 'Rent_Annual', 'Rent_Cumulative', 'Rent_Profit', 
                     'Bond_Annual', 'Bond_Cumulative', 'Bond_Profit',
                     'FD_Annual', 'FD_Cumulative', 'FD_Profit'];
    
    const rows = data.map(row => [
      row.year,
      row.rentIncome,
      row.rentCumulative,
      row.rentProfit,
      row.bondIncome,
      row.bondCumulative,
      row.bondProfit,
      row.fdIncome,
      row.fdCumulative,
      row.fdProfit
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investment_analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          Investment Comparison Calculator
        </h1>
        <p className="mt-2 text-blue-100">Compare rental property, bonds, and fixed deposits with customizable parameters</p>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <button
          onClick={() => setShowInputs(!showInputs)}
          className="w-full bg-gray-100 hover:bg-gray-200 p-4 flex items-center justify-between font-semibold text-gray-800 transition"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Input Parameters
          </span>
          <span>{showInputs ? '▲' : '▼'}</span>
        </button>
        
        {showInputs && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-full">
              <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b pb-2">General</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Investment (₹)
              </label>
              <input
                type="number"
                value={inputs.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Period (Years)
              </label>
              <input
                type="number"
                value={inputs.years}
                onChange={(e) => handleInputChange('years', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-full mt-4">
              <h3 className="font-semibold text-lg text-blue-700 mb-3 border-b border-blue-200 pb-2">Rental Property</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Houses
              </label>
              <input
                type="number"
                value={inputs.houses}
                onChange={(e) => handleInputChange('houses', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rent per House (₹)
              </label>
              <input
                type="number"
                value={inputs.monthlyRentPerHouse}
                onChange={(e) => handleInputChange('monthlyRentPerHouse', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Maintenance (Total) (₹)
              </label>
              <input
                type="number"
                value={inputs.monthlyMaintenance}
                onChange={(e) => handleInputChange('monthlyMaintenance', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rent Inflation Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.rentInflationRate}
                onChange={(e) => handleInputChange('rentInflationRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-full mt-4">
              <h3 className="font-semibold text-lg text-red-700 mb-3 border-b border-red-200 pb-2">Infrastructure Bond</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.bondRate}
                onChange={(e) => handleInputChange('bondRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bond Maturity (Years)
              </label>
              <input
                type="number"
                value={inputs.bondMaturity}
                onChange={(e) => handleInputChange('bondMaturity', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-full mt-4">
              <h3 className="font-semibold text-lg text-green-700 mb-3 border-b border-green-200 pb-2">Fixed Deposit</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.fdRate}
                onChange={(e) => handleInputChange('fdRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Compounding
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!inputs.fdCompounding}
                    onChange={() => handleInputChange('fdCompounding', false)}
                    className="w-4 h-4"
                  />
                  <span>Simple</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={inputs.fdCompounding}
                    onChange={() => handleInputChange('fdCompounding', true)}
                    className="w-4 h-4"
                  />
                  <span>Compound</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border-2 border-blue-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">Rental Investment</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 mb-1">Break-even: Year {breakEvenYears.rent}</p>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            {formatCurrency(finalYearData.rent.profit)}
          </p>
          <p className="text-xs text-gray-600">Profit after {inputs.years} years</p>
          <p className="text-sm font-semibold text-blue-700 mt-2">ROI: {finalYearData.rent.roi}%</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-lg border-2 border-red-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-red-900">Infrastructure Bond</h3>
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-red-700 mb-1">Break-even: Year {breakEvenYears.bond}</p>
          <p className="text-3xl font-bold text-red-600 mb-1">
            {formatCurrency(finalYearData.bond.profit)}
          </p>
          <p className="text-xs text-gray-600">Profit after {inputs.years} years</p>
          <p className="text-sm font-semibold text-red-700 mt-2">ROI: {finalYearData.bond.roi}%</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border-2 border-green-300 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-900">Fixed Deposit</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-green-700 mb-1">Break-even: Year {breakEvenYears.fd}</p>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {formatCurrency(finalYearData.fd.profit)}
          </p>
          <p className="text-xs text-gray-600">Profit after {inputs.years} years</p>
          <p className="text-sm font-semibold text-green-700 mt-2">ROI: {finalYearData.fd.roi}%</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedView('profit')}
          className={`px-4 py-2 rounded font-medium transition ${selectedView === 'profit' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Year-on-Year Profit
        </button>
        <button
          onClick={() => setSelectedView('cumulative')}
          className={`px-4 py-2 rounded font-medium transition ${selectedView === 'cumulative' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Cumulative Returns
        </button>
        <button
          onClick={() => setSelectedView('annual')}
          className={`px-4 py-2 rounded font-medium transition ${selectedView === 'annual' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Annual Income
        </button>
        <button
          onClick={() => setSelectedView('breakeven')}
          className={`px-4 py-2 rounded font-medium transition ${selectedView === 'breakeven' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Break-even Comparison
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <ResponsiveContainer width="100%" height={400}>
          {selectedView === 'profit' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Profit (₹)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="rentProfit" stroke="#3b82f6" name="Rental Profit" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bondProfit" stroke="#ef4444" name="Bond Profit" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fdProfit" stroke="#22c55e" name="FD Profit" strokeWidth={2} dot={false} />
            </LineChart>
          ) : selectedView === 'cumulative' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Cumulative Returns (₹)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="rentCumulative" stroke="#3b82f6" name="Rental" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bondCumulative" stroke="#ef4444" name="Bond" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fdCumulative" stroke="#22c55e" name="FD" strokeWidth={2} dot={false} />
            </LineChart>
          ) : selectedView === 'annual' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Annual Income (₹)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="rentIncome" stroke="#3b82f6" name="Rental Income" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bondIncome" stroke="#ef4444" name="Bond Income" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fdIncome" stroke="#22c55e" name="FD Income" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={[
              { name: 'Rental', years: breakEvenYears.rent === 'Never' ? 0 : breakEvenYears.rent, fill: '#3b82f6' },
              { name: 'Bond', years: breakEvenYears.bond === 'Never' ? 0 : breakEvenYears.bond, fill: '#ef4444' },
              { name: 'FD', years: breakEvenYears.fd === 'Never' ? 0 : breakEvenYears.fd, fill: '#22c55e' }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Years to Break-even', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="years" fill="#8884d8" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowTable(!showTable)}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 font-medium transition"
        >
          {showTable ? 'Hide' : 'Show'} Detailed Table
        </button>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition"
        >
          Export to CSV
        </button>
      </div>

      {showTable && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white border-b-2 border-gray-900">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-gray-800 z-10">Year</th>
                  <th className="px-3 py-3 text-center font-semibold" colSpan="3">Rental Investment</th>
                  <th className="px-3 py-3 text-center font-semibold" colSpan="3">Infrastructure Bond</th>
                  <th className="px-3 py-3 text-center font-semibold" colSpan="3">Fixed Deposit</th>
                </tr>
                <tr className="bg-gray-700">
                  <th className="px-3 py-2 text-left text-xs sticky left-0 bg-gray-700 z-10"></th>
                  <th className="px-3 py-2 text-right text-xs">Annual</th>
                  <th className="px-3 py-2 text-right text-xs">Cumulative</th>
                  <th className="px-3 py-2 text-right text-xs">Profit</th>
                  <th className="px-3 py-2 text-right text-xs">Annual</th>
                  <th className="px-3 py-2 text-right text-xs">Cumulative</th>
                  <th className="px-3 py-2 text-right text-xs">Profit</th>
                  <th className="px-3 py-2 text-right text-xs">Annual</th>
                  <th className="px-3 py-2 text-right text-xs">Cumulative</th>
                  <th className="px-3 py-2 text-right text-xs">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr 
                    key={row.year} 
                    className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}
                  >
                    <td className="px-3 py-2 font-semibold sticky left-0 bg-inherit z-10">{row.year}</td>
                    
                    <td className="px-3 py-2 text-right text-blue-700">{formatCurrency(row.rentIncome)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.rentCumulative)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${row.rentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.rentBreakEven && !data[idx - 1]?.rentBreakEven && <span className="text-xs bg-green-400 text-white px-1.5 py-0.5 rounded mr-1">✓</span>}
                      {formatCurrency(row.rentProfit)}
                    </td>
                    
                    <td className="px-3 py-2 text-right text-red-700">{formatCurrency(row.bondIncome)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.bondCumulative)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${row.bondProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.bondBreakEven && !data[idx - 1]?.bondBreakEven && <span className="text-xs bg-green-400 text-white px-1.5 py-0.5 rounded mr-1">✓</span>}
                      {formatCurrency(row.bondProfit)}
                    </td>
                    
                    <td className="px-3 py-2 text-right text-green-700">{formatCurrency(row.fdIncome)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(row.fdCumulative)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${row.fdProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.fdBreakEven && !data[idx - 1]?.fdBreakEven && <span className="text-xs bg-green-400 text-white px-1.5 py-0.5 rounded mr-1">✓</span>}
                      {formatCurrency(row.fdProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-700 bg-blue-50 p-5 rounded-lg border border-blue-200">
        <p className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
          <span className="text-lg">ℹ️</span> Key Information
        </p>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Break-even:</strong> When cumulative returns equal initial investment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Profit:</strong> Cumulative returns minus initial investment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>ROI:</strong> Return on Investment = (Profit / Initial Investment) × 100%</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Green checkmark (✓) indicates the break-even year in the table</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>All calculations update in real-time as you modify input parameters</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Bond returns principal at maturity (Year {inputs.bondMaturity}). Profit calculation shows interest earned before maturity, then total profit after principal return</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>FD uses {inputs.fdCompounding ? 'compound' : 'simple'} interest calculation. Principal is safe; profit shows interest earned</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Bond & FD:</strong> Principal-protected investments - profit never goes negative as principal is returned</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default InvestmentDashboard;