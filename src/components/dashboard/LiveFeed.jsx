import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAMES = ['Ravi Sharma', 'Deepika Joshi', 'Arjun Mehta', 'Fatima Shaikh', 'Vikram Singh',
  'Preethi Rao', 'Sanjay Gupta', 'Anita Desai', 'Mohan Lal', 'Nisha Pillai',
  'Karthik Suresh', 'Pooja Tiwari', 'Rohit Verma', 'Sneha Iyer', 'Ajay Kumar'];
const LOCATIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata', 'Jaipur'];
const AMOUNTS = ['₹1,20,000', '₹2,50,000', '₹3,75,000', '₹5,00,000', '₹8,00,000', '₹1,50,000', '₹4,20,000'];

const randPD = () => parseFloat((Math.random() * 0.9 + 0.05).toFixed(2));
const bandOf = (pd) => pd < 0.3 ? 'Low' : pd < 0.5 ? 'Moderate' : pd < 0.7 ? 'High' : 'Very High';
const pdColor = (pd) => pd >= 0.7 ? 'var(--risk-vhigh)' : pd >= 0.5 ? 'var(--risk-high)' : pd >= 0.3 ? 'var(--risk-mod)' : 'var(--risk-low)';
const bandClass = (band) => ({ Low: 'badge-low', Moderate: 'badge-moderate', High: 'badge-high', 'Very High': 'badge-very-high' }[band]);

let counter = 129;

export default function LiveFeed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const add = () => {
      const pd = randPD();
      setItems(prev => [{
        id: `APP-${String(counter++).padStart(5, '0')}`,
        name: NAMES[Math.floor(Math.random() * NAMES.length)],
        amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        pd,
        band: bandOf(pd),
        time: 'just now',
        key: Date.now() + Math.random(),
      }, ...prev.slice(0, 9)]);
    };

    add();
    const interval = setInterval(add, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-feed">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.key}
            className="live-item"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="live-id">{item.id}</span>
            <span className="live-name">{item.name}</span>
            <span className="live-amount">{item.amount}</span>
            <span className="live-pd" style={{ color: pdColor(item.pd) }}>{item.pd}</span>
            <span className={`badge ${bandClass(item.band)}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{item.band}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
