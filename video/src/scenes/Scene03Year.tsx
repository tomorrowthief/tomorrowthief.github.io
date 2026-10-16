import React from 'react';
import {YearCard} from '../components/YearCard';
import {yearEntry} from '../data/posts';

export const Scene03Year: React.FC = () => <YearCard entry={yearEntry(2023)} />;