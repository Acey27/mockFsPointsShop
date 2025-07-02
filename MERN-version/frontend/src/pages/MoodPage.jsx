import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FaceSmileIcon,
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const MoodPage= () => {
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState('');
  const [comment, setComment] = useState('');

  // Fetch mood history
  const { data: moodHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['mood-history'],
    queryFn: () => apiClient.getMoodHistory({}),
  });

  // Submit mood mutation
  const submitMoodMutation = useMutation({
    mutationFn: (moodData) =>
      apiClient.submitMood({ mood: moodData.mood, comment: moodData.comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-history'] });
      setSelectedMood('');
      setComment('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedMood) {
      submitMoodMutation.mutate({ mood: selectedMood, comment: comment.trim() || undefined });
    }
  };

  const moodOptions = [
    { value: 'excellent', emoji: '😄', label: 'Excellent', color: 'bg-green-500' },
    { value: 'good', emoji: '😊', label: 'Good', color: 'bg-blue-500' },
    { value: 'okay', emoji: '😐', label: 'Okay', color: 'bg-yellow-500' },
    { value: 'not-great', emoji: '😔', label: 'Not Great', color: 'bg-orange-500' },
    { value: 'poor', emoji: '😞', label: 'Poor', color: 'bg-red-500' }
  ];

  const getMoodStats = () => {
    if (!moodHistory || moodHistory.length === 0) return null;
    
    const last7Days = moodHistory.slice(0, 7);
    const moodCounts = last7Days.reduce((acc, mood) => {
      acc[mood.mood] = (acc[mood.mood] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommon = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0];
    return { mostCommon: mostCommon?.[0], total: last7Days.length };
  };

  const stats = getMoodStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Mood Check-in</h1>
        <p className="text-blue-600">How are you feeling today? Your wellbeing matters to us.</p>
      </div>

      {/* Current Mood Submission */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center space-x-2">
          <FaceSmileIcon className="w-5 h-5" />
          <span>Check in your mood</span>
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedMood(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedMood === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium text-gray-700">{option.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about how you're feeling or what's affecting your mood..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedMood || submitMoodMutation.isPending}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {submitMoodMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                <span>Submit Mood Check-in</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Mood Stats */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5" />
            <span>Your Recent Mood Trends</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-600">Check-ins this week</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900 capitalize">{stats.mostCommon}</div>
              <div className="text-sm text-blue-600">Most common mood</div>
            </div>
          </div>
        </div>
      )}

      {/* Mood History */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100">
        <div className="p-6 border-b border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <span>Your Mood History</span>
          </h3>
        </div>
        <div className="p-6">
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading mood history..." />
            </div>
          ) : (
            <div className="space-y-4">
              {moodHistory?.slice(0, 10).map((mood) => {
                const moodOption = moodOptions.find(option => option.value === mood.mood);
                return (
                  <div key={mood._id} className="flex items-start space-x-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-2xl">{moodOption?.emoji || '😐'}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-blue-900 capitalize">{mood.mood}</span>
                        <span className="text-xs text-blue-600">
                          {new Date(mood.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {mood.comment && (
                        <p className="text-sm text-blue-700 italic">"{mood.comment}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!moodHistory || moodHistory.length === 0) && (
                <p className="text-center text-gray-500 py-8">
                  No mood check-ins yet. Submit your first one above!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodPage;
