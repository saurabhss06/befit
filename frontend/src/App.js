import { useState, useEffect, createContext, useContext } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, Dumbbell, Utensils, TrendingUp, User, Plus, X, Calendar, Clock, Flame, Target, Moon, Sun, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme Context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark, setIsDark } = useTheme();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" data-testid="loading-spinner">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-electric-blue border-t-transparent"></div>
          <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-electric-blue" />
        </div>
      </div>
    );
  }

  const caloriesProgress = stats ? Math.min((stats.calories_consumed_today / stats.target_calories) * 100, 100) : 0;
  const proteinProgress = stats ? Math.min((stats.protein_consumed_today / stats.target_protein) * 100, 100) : 0;
  const carbsProgress = stats ? Math.min((stats.carbs_consumed_today / stats.target_carbs) * 100, 100) : 0;
  const fatsProgress = stats ? Math.min((stats.fats_consumed_today / stats.target_fats) * 100, 100) : 0;

  return (
    <div className="pb-24 px-4 pt-6 min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900" data-testid="dashboard-page">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-electric-blue to-cyan-400 rounded-xl shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="dashboard-greeting">Welcome Back!</h1>
            </div>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-electric-blue dark:hover:border-electric-blue shadow-md hover:shadow-lg transition-all"
            data-testid="theme-toggle-button"
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-energy-orange" />
            ) : (
              <Moon className="h-5 w-5 text-electric-blue" />
            )}
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-14" data-testid="dashboard-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Streak Card */}
      <Card className="mb-6 bg-gradient-to-br from-energy-orange via-orange-500 to-red-500 text-white border-0 shadow-2xl overflow-hidden relative" data-testid="streak-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        <CardContent className="pt-6 pb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-300" />
                <p className="text-white/90 text-sm font-medium">Current Streak</p>
              </div>
              <h2 className="text-5xl font-bold mb-1" data-testid="streak-count">{stats?.workout_streak || 0}</h2>
              <p className="text-white/80 text-sm">days in a row</p>
            </div>
            <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-md shadow-xl">
              <Flame className="h-12 w-12 text-yellow-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Activity */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl" data-testid="workouts-card">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-electric-blue to-cyan-400 p-4 rounded-2xl mb-3 shadow-lg">
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-electric-blue to-cyan-500 bg-clip-text text-transparent" data-testid="workouts-count">{stats?.total_workouts_today || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">Workouts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl" data-testid="calories-burned-card">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-lime-green to-green-400 p-4 rounded-2xl mb-3 shadow-lg">
                <Flame className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-lime-green to-green-500 bg-clip-text text-transparent" data-testid="calories-burned-count">{stats?.calories_burned_today || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">Cal Burned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nutrition Overview */}
      <Card className="mb-6 border-0 shadow-xl bg-white dark:bg-gray-800" data-testid="nutrition-overview-card">
        <CardHeader className="border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl dark:text-white">Today's Nutrition</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Calories</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white" data-testid="calories-consumed">{stats?.calories_consumed_today || 0} / {stats?.target_calories || 0}</span>
            </div>
            <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-electric-blue to-cyan-400 rounded-full"
                style={{ width: `${caloriesProgress}%` }}
                data-testid="calories-progress"
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Protein</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white" data-testid="protein-consumed">{stats?.protein_consumed_today || 0}g / {stats?.target_protein || 0}g</span>
            </div>
            <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                style={{ width: `${proteinProgress}%` }}
                data-testid="protein-progress"
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Carbs</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white" data-testid="carbs-consumed">{stats?.carbs_consumed_today || 0}g / {stats?.target_carbs || 0}g</span>
            </div>
            <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                style={{ width: `${carbsProgress}%` }}
                data-testid="carbs-progress"
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fats</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white" data-testid="fats-consumed">{stats?.fats_consumed_today || 0}g / {stats?.target_fats || 0}g</span>
            </div>
            <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-lime-green to-green-400 rounded-full"
                style={{ width: `${fatsProgress}%` }}
                data-testid="fats-progress"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Workouts Component
const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [activeTab, setActiveTab] = useState('log');
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    workout_type: '',
    duration: '',
    calories_burned: '',
    intensity: 'moderate',
    notes: ''
  });

  useEffect(() => {
    fetchWorkouts();
    fetchWorkoutPlans();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await axios.get(`${API}/workouts?limit=20`);
      setWorkouts(response.data);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      toast.error('Failed to load workouts');
    }
  };

  const fetchWorkoutPlans = async () => {
    try {
      const response = await axios.get(`${API}/workout-plans`);
      setWorkoutPlans(response.data);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/workouts`, {
        workout_type: formData.workout_type,
        duration: parseInt(formData.duration),
        calories_burned: parseInt(formData.calories_burned),
        intensity: formData.intensity,
        notes: formData.notes || null
      });
      toast.success('Workout logged successfully!');
      setShowAddWorkout(false);
      setFormData({
        workout_type: '',
        duration: '',
        calories_burned: '',
        intensity: 'moderate',
        notes: ''
      });
      fetchWorkouts();
    } catch (error) {
      console.error('Error adding workout:', error);
      toast.error('Failed to log workout');
    }
  };

  const handleDelete = async (workoutId) => {
    try {
      await axios.delete(`${API}/workouts/${workoutId}`);
      toast.success('Workout deleted successfully!');
      fetchWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  return (
    <div className="pb-24 px-4 pt-6 min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900" data-testid="workouts-page">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-electric-blue to-cyan-400 rounded-xl shadow-lg">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="workouts-title">Workouts</h1>
        </div>
        <Button
          onClick={() => setShowAddWorkout(true)}
          className="bg-gradient-to-r from-electric-blue via-cyan-500 to-electric-blue hover:scale-105 text-white rounded-full h-14 w-14 p-0 shadow-2xl border-4 border-white dark:border-gray-900 animate-pulse hover:animate-none"
          data-testid="add-workout-button"
        >
          <Plus className="h-8 w-8 stroke-[3]" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="workouts-tabs">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg">
          <TabsTrigger value="log" data-testid="log-tab" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-electric-blue data-[state=active]:to-cyan-500 data-[state=active]:text-white">Activity Log</TabsTrigger>
          <TabsTrigger value="plans" data-testid="plans-tab" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-electric-blue data-[state=active]:to-cyan-500 data-[state=active]:text-white">Workout Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="log" data-testid="log-tab-content">
          <div className="space-y-4">
            {workouts.length === 0 ? (
              <Card className="border-0 shadow-xl bg-white dark:bg-gray-800" data-testid="no-workouts-message">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <Dumbbell className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No workouts logged yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Start tracking your fitness journey!</p>
                </CardContent>
              </Card>
            ) : (
              workouts.map((workout) => (
                <Card key={workout.id} className="border-0 shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl" data-testid={`workout-card-${workout.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-gradient-to-br from-electric-blue to-cyan-400 p-2.5 rounded-xl shadow-md">
                            <Dumbbell className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white" data-testid={`workout-type-${workout.id}`}>{workout.workout_type}</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm ml-12">
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span data-testid={`workout-duration-${workout.id}`}>{workout.duration} min</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Flame className="h-4 w-4" />
                            <span data-testid={`workout-calories-${workout.id}`}>{workout.calories_burned} cal</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Target className="h-4 w-4 text-energy-orange" />
                            <span className="capitalize text-gray-600 dark:text-gray-400" data-testid={`workout-intensity-${workout.id}`}>{workout.intensity}</span>
                          </div>
                        </div>
                        {workout.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 ml-12 italic" data-testid={`workout-notes-${workout.id}`}>"{workout.notes}"</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 ml-12" data-testid={`workout-date-${workout.id}`}>
                          {new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(workout.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                        data-testid={`delete-workout-${workout.id}`}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="plans" data-testid="plans-tab-content">
          <div className="space-y-4">
            {workoutPlans.length === 0 ? (
              <Card className="border-0 shadow-xl bg-white dark:bg-gray-800" data-testid="no-plans-message">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No workout plans yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create custom workout plans to stay organized!</p>
                </CardContent>
              </Card>
            ) : (
              workoutPlans.map((plan) => (
                <Card key={plan.id} className="border-0 shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl" data-testid={`plan-card-${plan.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg dark:text-white" data-testid={`plan-name-${plan.id}`}>{plan.name}</CardTitle>
                        <CardDescription className="mt-1 dark:text-gray-400" data-testid={`plan-description-${plan.id}`}>{plan.description}</CardDescription>
                      </div>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-energy-orange to-orange-400 text-white rounded-full text-xs font-semibold shadow-md" data-testid={`plan-difficulty-${plan.id}`}>
                        {plan.difficulty}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span data-testid={`plan-duration-${plan.id}`}>{plan.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Dumbbell className="h-4 w-4" />
                        <span data-testid={`plan-exercises-${plan.id}`}>{plan.exercises.length} exercises</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {plan.exercises.slice(0, 3).map((exercise, idx) => (
                        <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg" data-testid={`plan-exercise-${plan.id}-${idx}`}>
                          <span className="font-medium">{exercise.name}</span> - {exercise.sets} sets × {exercise.reps} reps
                        </div>
                      ))}
                      {plan.exercises.length > 3 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">+ {plan.exercises.length - 3} more exercises</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Workout Dialog */}
      <Dialog open={showAddWorkout} onOpenChange={setShowAddWorkout}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800" data-testid="add-workout-dialog">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Log Workout</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Track your training session</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="workout_type" className="dark:text-gray-300">Workout Type</Label>
              <Input
                id="workout_type"
                placeholder="e.g., Running, Weight Training"
                value={formData.workout_type}
                onChange={(e) => setFormData({ ...formData, workout_type: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                data-testid="workout-type-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration" className="dark:text-gray-300">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  data-testid="workout-duration-input"
                />
              </div>
              <div>
                <Label htmlFor="calories" className="dark:text-gray-300">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="300"
                  value={formData.calories_burned}
                  onChange={(e) => setFormData({ ...formData, calories_burned: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  data-testid="workout-calories-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="intensity" className="dark:text-gray-300">Intensity</Label>
              <Select
                value={formData.intensity}
                onValueChange={(value) => setFormData({ ...formData, intensity: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600" data-testid="workout-intensity-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  <SelectItem value="light" data-testid="intensity-light">Light</SelectItem>
                  <SelectItem value="moderate" data-testid="intensity-moderate">Moderate</SelectItem>
                  <SelectItem value="intense" data-testid="intensity-intense">Intense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" className="dark:text-gray-300">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="How did it go?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                data-testid="workout-notes-input"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-electric-blue to-cyan-500 hover:from-electric-blue/90 hover:to-cyan-500/90 text-white shadow-lg" data-testid="submit-workout-button">
              Log Workout
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Nutrition Component
const Nutrition = () => {
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    meal_name: '',
    meal_type: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  useEffect(() => {
    fetchNutritionLogs();
  }, []);

  const fetchNutritionLogs = async () => {
    try {
      const response = await axios.get(`${API}/nutrition?limit=20`);
      setNutritionLogs(response.data);
    } catch (error) {
      console.error('Error fetching nutrition logs:', error);
      toast.error('Failed to load nutrition logs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/nutrition`, {
        meal_name: formData.meal_name,
        meal_type: formData.meal_type,
        calories: parseInt(formData.calories),
        protein: parseInt(formData.protein),
        carbs: parseInt(formData.carbs),
        fats: parseInt(formData.fats)
      });
      toast.success('Meal logged successfully!');
      setShowAddMeal(false);
      setFormData({
        meal_name: '',
        meal_type: 'breakfast',
        calories: '',
        protein: '',
        carbs: '',
        fats: ''
      });
      fetchNutritionLogs();
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('Failed to log meal');
    }
  };

  const handleDelete = async (logId) => {
    try {
      await axios.delete(`${API}/nutrition/${logId}`);
      toast.success('Meal deleted successfully!');
      fetchNutritionLogs();
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Failed to delete meal');
    }
  };

  const getMealIcon = (mealType) => {
    const colors = {
      breakfast: 'from-energy-orange to-orange-400',
      lunch: 'from-electric-blue to-cyan-400',
      dinner: 'from-lime-green to-green-400',
      snack: 'from-purple-500 to-pink-500'
    };
    return colors[mealType] || 'from-gray-500 to-gray-400';
  };

  return (
    <div className="pb-24 px-4 pt-6 min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900" data-testid="nutrition-page">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-lime-green to-green-400 rounded-xl shadow-lg">
            <Utensils className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="nutrition-title">Nutrition</h1>
        </div>
        <Button
          onClick={() => setShowAddMeal(true)}
          className="bg-gradient-to-r from-lime-green via-green-500 to-lime-green hover:scale-105 text-white rounded-full h-14 w-14 p-0 shadow-2xl border-4 border-white dark:border-gray-900 animate-pulse hover:animate-none"
          data-testid="add-meal-button"
        >
          <Plus className="h-8 w-8 stroke-[3]" />
        </Button>
      </div>

      <div className="space-y-4">
        {nutritionLogs.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800" data-testid="no-nutrition-message">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Utensils className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No meals logged yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Start tracking your nutrition!</p>
            </CardContent>
          </Card>
        ) : (
          nutritionLogs.map((log) => (
            <Card key={log.id} className="border-0 shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl" data-testid={`nutrition-card-${log.id}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`bg-gradient-to-br ${getMealIcon(log.meal_type)} p-2.5 rounded-xl shadow-md`}>
                        <Utensils className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white" data-testid={`meal-name-${log.id}`}>{log.meal_name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium" data-testid={`meal-type-${log.id}`}>{log.meal_type}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 ml-12">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid={`meal-calories-${log.id}`}>{log.calories}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cal</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400" data-testid={`meal-protein-${log.id}`}>{log.protein}g</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Protein</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-orange-700 dark:text-orange-400" data-testid={`meal-carbs-${log.id}`}>{log.carbs}g</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Carbs</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-green-700 dark:text-green-400" data-testid={`meal-fats-${log.id}`}>{log.fats}g</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Fats</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 ml-12" data-testid={`meal-date-${log.id}`}>
                      {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(log.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                    data-testid={`delete-meal-${log.id}`}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800" data-testid="add-meal-dialog">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Log Meal</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Track your nutrition intake</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="meal_name" className="dark:text-gray-300">Meal Name</Label>
              <Input
                id="meal_name"
                placeholder="e.g., Chicken Salad"
                value={formData.meal_name}
                onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                data-testid="meal-name-input"
              />
            </div>
            <div>
              <Label htmlFor="meal_type" className="dark:text-gray-300">Meal Type</Label>
              <Select
                value={formData.meal_type}
                onValueChange={(value) => setFormData({ ...formData, meal_type: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600" data-testid="meal-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  <SelectItem value="breakfast" data-testid="meal-type-breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch" data-testid="meal-type-lunch">Lunch</SelectItem>
                  <SelectItem value="dinner" data-testid="meal-type-dinner">Dinner</SelectItem>
                  <SelectItem value="snack" data-testid="meal-type-snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="calories" className="dark:text-gray-300">Calories</Label>
              <Input
                id="calories"
                type="number"
                placeholder="400"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                required
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                data-testid="meal-calories-input"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="protein" className="dark:text-gray-300">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  placeholder="30"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  data-testid="meal-protein-input"
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="dark:text-gray-300">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  placeholder="45"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  data-testid="meal-carbs-input"
                />
              </div>
              <div>
                <Label htmlFor="fats" className="dark:text-gray-300">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  placeholder="15"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  data-testid="meal-fats-input"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-lime-green to-green-500 hover:from-lime-green/90 hover:to-green-500/90 text-white shadow-lg" data-testid="submit-meal-button">
              Log Meal
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Progress Component
const Progress_Page = () => {
  const [workouts, setWorkouts] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workoutsRes, nutritionRes] = await Promise.all([
        axios.get(`${API}/workouts?limit=30`),
        axios.get(`${API}/nutrition?limit=30`)
      ]);
      setWorkouts(workoutsRes.data);
      setNutritionLogs(nutritionRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load progress data');
    }
  };

  const getLast7DaysStats = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push({
        date: date,
        workouts: 0,
        calories_burned: 0,
        calories_consumed: 0
      });
    }

    workouts.forEach(workout => {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      const dayIndex = last7Days.findIndex(day => day.date.getTime() === workoutDate.getTime());
      if (dayIndex !== -1) {
        last7Days[dayIndex].workouts++;
        last7Days[dayIndex].calories_burned += workout.calories_burned;
      }
    });

    nutritionLogs.forEach(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const dayIndex = last7Days.findIndex(day => day.date.getTime() === logDate.getTime());
      if (dayIndex !== -1) {
        last7Days[dayIndex].calories_consumed += log.calories;
      }
    });

    return last7Days;
  };

  const stats = getLast7DaysStats();
  const totalWorkouts = workouts.length;
  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + w.calories_burned, 0);
  const avgWorkoutDuration = workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.duration, 0) / workouts.length) : 0;

  return (
    <div className="pb-24 px-4 pt-6 min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900" data-testid="progress-page">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="progress-title">Progress</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800" data-testid="total-workouts-card">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-electric-blue to-cyan-500 bg-clip-text text-transparent" data-testid="total-workouts-stat">{totalWorkouts}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">Total Workouts</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800" data-testid="total-calories-card">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-lime-green to-green-500 bg-clip-text text-transparent" data-testid="total-calories-stat">{totalCaloriesBurned}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">Cal Burned</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-800" data-testid="avg-duration-card">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-energy-orange to-orange-500 bg-clip-text text-transparent" data-testid="avg-duration-stat">{avgWorkoutDuration}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">Avg Min</p>
          </CardContent>
        </Card>
      </div>

      {/* Last 7 Days */}
      <Card className="mb-6 border-0 shadow-xl bg-white dark:bg-gray-800" data-testid="last-7-days-card">
        <CardHeader>
          <CardTitle className="text-lg dark:text-white">Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((day, idx) => (
              <div key={idx} className="space-y-2" data-testid={`day-stat-${idx}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium" data-testid={`day-workouts-${idx}`}>{day.workouts} workouts</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-electric-blue to-lime-green rounded-full"
                        style={{ width: `${Math.min((day.calories_burned / 500) * 100, 100)}%` }}
                        data-testid={`day-burned-bar-${idx}`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" data-testid={`day-burned-${idx}`}>Burned: {day.calories_burned} cal</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-energy-orange to-lime-green rounded-full"
                        style={{ width: `${Math.min((day.calories_consumed / 2000) * 100, 100)}%` }}
                        data-testid={`day-consumed-bar-${idx}`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" data-testid={`day-consumed-${idx}`}>Consumed: {day.calories_consumed} cal</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Profile Component
const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const { isDark, setIsDark } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    target_calories: '',
    target_protein: '',
    target_carbs: '',
    target_fats: '',
    goal: 'maintain'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        age: response.data.age || '',
        weight: response.data.weight || '',
        height: response.data.height || '',
        target_calories: response.data.target_calories || '',
        target_protein: response.data.target_protein || '',
        target_carbs: response.data.target_carbs || '',
        target_fats: response.data.target_fats || '',
        goal: response.data.goal || 'maintain'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (profile && profile.id) {
        await axios.put(`${API}/profile/${profile.id}`, {
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          target_calories: parseInt(formData.target_calories),
          target_protein: parseInt(formData.target_protein),
          target_carbs: parseInt(formData.target_carbs),
          target_fats: parseInt(formData.target_fats),
          goal: formData.goal
        });
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(`${API}/profile`, {
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          target_calories: parseInt(formData.target_calories),
          target_protein: parseInt(formData.target_protein),
          target_carbs: parseInt(formData.target_carbs),
          target_fats: parseInt(formData.target_fats),
          goal: formData.goal
        });
        toast.success('Profile created successfully!');
      }
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  return (
    <div className="pb-24 px-4 pt-6 min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900" data-testid="profile-page">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="profile-title">Profile</h1>
        </div>
        {!editing && (
          <Button
            onClick={() => setEditing(true)}
            variant="outline"
            className="border-2 border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-white dark:border-electric-blue dark:text-electric-blue"
            data-testid="edit-profile-button"
          >
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="profile-form">
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="dark:text-gray-300">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  data-testid="profile-name-input"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age" className="dark:text-gray-300">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    data-testid="profile-age-input"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="dark:text-gray-300">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    data-testid="profile-weight-input"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="dark:text-gray-300">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    placeholder="175"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    data-testid="profile-height-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="goal" className="dark:text-gray-300">Goal</Label>
                <Select
                  value={formData.goal}
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600" data-testid="profile-goal-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700">
                    <SelectItem value="lose_weight" data-testid="goal-lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain" data-testid="goal-maintain">Maintain</SelectItem>
                    <SelectItem value="gain_muscle" data-testid="goal-gain">Gain Muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Daily Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="target_calories" className="dark:text-gray-300">Calories</Label>
                <Input
                  id="target_calories"
                  type="number"
                  value={formData.target_calories}
                  onChange={(e) => setFormData({ ...formData, target_calories: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  data-testid="profile-calories-input"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="target_protein" className="dark:text-gray-300">Protein (g)</Label>
                  <Input
                    id="target_protein"
                    type="number"
                    value={formData.target_protein}
                    onChange={(e) => setFormData({ ...formData, target_protein: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    data-testid="profile-protein-input"
                  />
                </div>
                <div>
                  <Label htmlFor="target_carbs" className="dark:text-gray-300">Carbs (g)</Label>
                  <Input
                    id="target_carbs"
                    type="number"
                    value={formData.target_carbs}
                    onChange={(e) => setFormData({ ...formData, target_carbs: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    data-testid="profile-carbs-input"
                  />
                </div>
                <div>
                  <Label htmlFor="target_fats" className="dark:text-gray-300">Fats (g)</Label>
                  <Input
                    id="target_fats"
                    type="number"
                    value={formData.target_fats}
                    onChange={(e) => setFormData({ ...formData, target_fats: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    data-testid="profile-fats-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-electric-blue to-cyan-500 hover:from-electric-blue/90 hover:to-cyan-500/90 text-white shadow-lg"
              data-testid="save-profile-button"
            >
              Save Profile
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
              className="flex-1 dark:border-gray-600 dark:text-gray-300"
              data-testid="cancel-profile-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800" data-testid="profile-display">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-name-display">{profile?.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Age</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-age-display">{profile?.age || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Weight</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-weight-display">{profile?.weight ? `${profile.weight} kg` : 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Height</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-height-display">{profile?.height ? `${profile.height} cm` : 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goal</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize" data-testid="profile-goal-display">{profile?.goal?.replace('_', ' ') || 'Not set'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Daily Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Calories</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-calories-display">{profile?.target_calories || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Protein</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-protein-display">{profile?.target_protein || 0}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Carbs</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-carbs-display">{profile?.target_carbs || 0}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fats</span>
                <span className="font-semibold text-gray-900 dark:text-white" data-testid="profile-fats-display">{profile?.target_fats || 0}g</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Bottom Navigation
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const navItems = [
    { path: '/', icon: Home, label: 'Home', testId: 'nav-home' },
    { path: '/workouts', icon: Dumbbell, label: 'Workouts', testId: 'nav-workouts' },
    { path: '/nutrition', icon: Utensils, label: 'Nutrition', testId: 'nav-nutrition' },
    { path: '/progress', icon: TrendingUp, label: 'Progress', testId: 'nav-progress' },
    { path: '/profile', icon: User, label: 'Profile', testId: 'nav-profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 backdrop-blur-lg" data-testid="bottom-navigation">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 relative ${
                isActive ? 'text-electric-blue' : 'text-gray-500 dark:text-gray-400'
              }`}
              data-testid={item.testId}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-electric-blue to-cyan-500 rounded-b-full"></div>
              )}
              <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <div className="App min-h-screen">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<><Dashboard /><BottomNav /></>} />
            <Route path="/workouts" element={<><Workouts /><BottomNav /></>} />
            <Route path="/nutrition" element={<><Nutrition /><BottomNav /></>} />
            <Route path="/progress" element={<><Progress_Page /><BottomNav /></>} />
            <Route path="/profile" element={<><Profile /><BottomNav /></>} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;