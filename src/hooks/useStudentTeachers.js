import { useState, useCallback, useRef } from 'react';
import { getTeachersGroupedByProfession, searchTeachers } from '../database/database';
import logger from '../utils/logger';

/**
 * Custom hook to manage teacher list, search, filtering, and favorites
 * Encapsulates all teacher-related state logic for StudentDashboard
 */
export const useStudentTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [groupedTeachers, setGroupedTeachers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoriteTeachers, setFavoriteTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Prevent concurrent teacher fetches
  const isTeachersFetchingRef = useRef(false);

  // Fetch all teachers grouped by profession
  const fetchTeachers = useCallback(async () => {
    // Skip if already fetching
    if (isTeachersFetchingRef.current) {
      logger.warn('Teachers fetch already in progress, skipping duplicate request');
      return;
    }

    isTeachersFetchingRef.current = true;
    try {
      setLoading(true);
      logger.info('Fetching teachers grouped by profession...');
      const grouped = await getTeachersGroupedByProfession();
      setGroupedTeachers(grouped || {});

      // Flatten for search/filter functionality
      const allTeachers = Object.values(grouped).flat();
      setTeachers(allTeachers || []);
      logger.success('Teachers loaded:', Object.keys(grouped).length, 'professions');
    } catch (error) {
      logger.error('Error fetching teachers:', error);
      setTeachers([]);
      setGroupedTeachers({});
      throw error;
    } finally {
      setLoading(false);
      isTeachersFetchingRef.current = false;
    }
  }, []);

  // Search teachers by query
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      // Reset to all teachers
      const allTeachers = Object.values(groupedTeachers).flat();
      setTeachers(allTeachers);
      return;
    }

    try {
      const results = await searchTeachers(query);
      setTeachers(results);
    } catch (error) {
      logger.error('Search error:', error);
    }
  }, [groupedTeachers]);

  // Filter by category
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      const allTeachers = Object.values(groupedTeachers).flat();
      setTeachers(allTeachers);
    } else {
      const filtered = groupedTeachers[category] || [];
      setTeachers(filtered);
    }
  }, [groupedTeachers]);

  // Toggle favorite teacher
  const toggleFavorite = useCallback((teacherId) => {
    setFavoriteTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  }, []);

  // Check if teacher is favorite
  const isFavorite = useCallback((teacherId) => {
    return favoriteTeachers.includes(teacherId);
  }, [favoriteTeachers]);

  return {
    teachers,
    groupedTeachers,
    searchQuery,
    selectedCategory,
    favoriteTeachers,
    loading,
    fetchTeachers,
    handleSearch,
    handleCategoryChange,
    toggleFavorite,
    isFavorite,
  };
};
