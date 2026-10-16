import React from 'react';
import {YearCard} from '../components/YearCard';
import {yearEntry} from '../data/posts';

export const Scene06Year: React.FC = () => <YearCard entry={yearEntry(2026)} />;