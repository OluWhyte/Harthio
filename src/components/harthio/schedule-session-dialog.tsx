"use client";

import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isToday,
  format,
  formatDistanceStrict,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useAuth } from "@/hooks/use-auth";
import { topicService } from "@/lib/supabase-services";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorType } from "@/lib/error-utils";
import { useNewSessionConflictCheck } from "@/hooks/use-schedule-conflict-check";
import { ScheduleConflictWarning } from "@/components/common/schedule-conflict-warning";

import {
  validateTopicTitle,
  validateTopicDescription,
  validateSessionDateTime,
  validateFields,
} from "@/lib/validation-utils";
import {
  FieldValidation,
  FormValidationSummary,
} from "@/components/common/form-validation-feedback";
import { useSessionSuccessFeedback } from "@/hooks/use-success-feedback";
import { aiService } from "@/ai/ai-service";

// Helper function to convert 12-hour format to 24-hour
function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(/\s+/);
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

const scheduleSessionSchema = z
  .object({
    topic: z
      .string()
      .min(5, { message: "Topic must be at least 5 characters." })
      .max(100, { message: "Topic must be less than 100 characters." }),
    description: z
      .string()
      .min(10, { message: "Description must be at least 10 characters." })
      .max(500, { message: "Description must be less than 500 characters." }),
    date: z.date({ required_error: "A date is required." }),
    startTime: z.string().min(1, { message: "Start time is required." }),
    endTime: z.string().min(1, { message: "End time is required." }),
    // Hidden fields for individual components
    startHour: z.string().optional(),
    startMinute: z.string().optional(),
    startPeriod: z.string().optional(),
    endHour: z.string().optional(),
    endMinute: z.string().optional(),
    endPeriod: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const startTime24 = convertTo24Hour(data.startTime);
        const endTime24 = convertTo24Hour(data.endTime);

        const [startHours, startMinutes] = startTime24.split(":").map(Number);
        const [endHours, endMinutes] = endTime24.split(":").map(Number);

        const startDate = setMinutes(
          setHours(new Date(), startHours),
          startMinutes
        );
        const endDate = setMinutes(setHours(new Date(), endHours), endMinutes);

        return endDate > startDate;
      }
      return true;
    },
    {
      message: "End time must be after start time.",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (data.date && data.startTime && isToday(data.date)) {
        const startTime24 = convertTo24Hour(data.startTime);
        const [startHours, startMinutes] = startTime24.split(":").map(Number);
        const startDateTime = setMinutes(
          setHours(data.date, startHours),
          startMinutes
        );
        const now = new Date();
        return startDateTime > now;
      }
      return true;
    },
    {
      message: "Start time cannot be in the past.",
      path: ["startTime"],
    }
  );

type SessionData = z.infer<typeof scheduleSessionSchema>;

interface ScheduleSessionDialogProps {
  children: ReactNode;
  onSessionCreated?: () => void;
}

export function ScheduleSessionDialog({
  children,
  onSessionCreated,
}: ScheduleSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { toast } = useToast();
  const [calculatedDuration, setCalculatedDuration] = useState<string | null>(
    null
  );
  const { user, userProfile } = useAuth();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const {
    handleError,
    executeWithRetry,
    retry,
    isRetrying,
    hasError,
    clearError,
  } = useErrorHandler({
    context: "Schedule Session",
    showToast: false, // Disable toast notifications - we only want the success toast
    logErrors: true,
  });
  const { showSessionCreatedSuccess } = useSessionSuccessFeedback();
  
  // AI Topic Helper state
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Get current time for default values
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours >= 12 ? "PM" : "AM";
    const roundedMinutes = Math.ceil(minutes / 15) * 15; // Round to next 15-minute interval
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
    const finalHour =
      roundedMinutes === 60 ? (hour12 === 12 ? 1 : hour12 + 1) : hour12;
    const finalPeriod = roundedMinutes === 60 && hours === 23 ? "AM" : period;

    return {
      hour: finalHour.toString(),
      minute: finalMinutes.toString().padStart(2, "0"),
      period: finalPeriod,
      timeString: `${finalHour.toString().padStart(2, "0")}:${finalMinutes
        .toString()
        .padStart(2, "0")} ${finalPeriod}`,
    };
  };

  const currentTime = getCurrentTime();
  const defaultEndTime = (() => {
    const endHour =
      currentTime.hour === "12"
        ? "1"
        : (parseInt(currentTime.hour) + 1).toString();
    return `${endHour.padStart(2, "0")}:${currentTime.minute} ${
      currentTime.period
    }`;
  })();

  const form = useForm<SessionData>({
    resolver: zodResolver(scheduleSessionSchema),
    defaultValues: {
      topic: "",
      description: "",
      startTime: currentTime.timeString,
      endTime: defaultEndTime,
      startHour: currentTime.hour,
      startMinute: currentTime.minute,
      startPeriod: currentTime.period,
      endHour:
        currentTime.hour === "12"
          ? "1"
          : (parseInt(currentTime.hour) + 1).toString(),
      endMinute: currentTime.minute,
      endPeriod: currentTime.period,
    },
  });

  const date = form.watch("date");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  // Parse form values for conflict checking
  const watchedDate = form.watch("date");
  const watchedStartTime = form.watch("startTime");
  const watchedEndTime = form.watch("endTime");

  // Parse watched values for conflict checking
  const startDateTime = watchedDate && watchedStartTime 
    ? (() => {
        try {
          const startTime24 = convertTo24Hour(watchedStartTime);
          const [startHours, startMinutes] = startTime24.split(":").map(Number);
          return setMilliseconds(
            setSeconds(setMinutes(setHours(watchedDate, startHours), startMinutes), 0),
            0
          );
        } catch {
          return null;
        }
      })()
    : null;
  const endDateTime = watchedDate && watchedEndTime 
    ? (() => {
        try {
          const endTime24 = convertTo24Hour(watchedEndTime);
          const [endHours, endMinutes] = endTime24.split(":").map(Number);
          return setMilliseconds(
            setSeconds(setMinutes(setHours(watchedDate, endHours), endMinutes), 0),
            0
          );
        } catch {
          return null;
        }
      })()
    : null;

  // Check for schedule conflicts in real-time
  const { conflictResult, isChecking: isCheckingConflicts } = useNewSessionConflictCheck(
    user?.uid || null,
    startDateTime,
    endDateTime,
    { enabled: open && !!user }
  );

  useEffect(() => {
    if (date && startTime && endTime) {
      try {
        const startTime24 = convertTo24Hour(startTime);
        const endTime24 = convertTo24Hour(endTime);

        const [startHours, startMinutes] = startTime24.split(":").map(Number);
        const [endHours, endMinutes] = endTime24.split(":").map(Number);

        const startDateTime = setMilliseconds(
          setSeconds(setMinutes(setHours(date, startHours), startMinutes), 0),
          0
        );
        const endDateTime = setMilliseconds(
          setSeconds(setMinutes(setHours(date, endHours), endMinutes), 0),
          0
        );

        if (endDateTime > startDateTime) {
          setCalculatedDuration(
            formatDistanceStrict(endDateTime, startDateTime)
          );
        } else {
          setCalculatedDuration(null);
        }
      } catch (error) {
        setCalculatedDuration(null);
      }
    } else {
      setCalculatedDuration(null);
    }
  }, [date, startTime, endTime]);

  const onSubmit = async (data: SessionData) => {
    if (!user || !userProfile) {
      handleError(new Error("You must be logged in to create a session."), {
        context: "authentication",
        operation: "createSession",
      });
      return;
    }

    // Clear previous validation errors
    setValidationErrors({});
    clearError();

    try {
      // Comprehensive validation using validation utils
      const validationResult = validateFields({
        title: { value: data.topic, validator: validateTopicTitle },
        description: {
          value: data.description,
          validator: validateTopicDescription,
        },
      });

      if (!validationResult.isValid) {
        setValidationErrors(validationResult.errors);
        handleError(new Error("Please fix the validation errors below."), {
          validationErrors: validationResult.errors,
        });
        return;
      }

      // Combine time components and convert to 24-hour format
      const startTime = `${data.startHour}:${data.startMinute} ${data.startPeriod}`;
      const endTime = `${data.endHour}:${data.endMinute} ${data.endPeriod}`;

      const startTime24 = convertTo24Hour(startTime);
      const endTime24 = convertTo24Hour(endTime);

      const [startHours, startMinutes] = startTime24.split(":").map(Number);
      const [endHours, endMinutes] = endTime24.split(":").map(Number);

      const startDateTime = setMilliseconds(
        setSeconds(
          setMinutes(setHours(data.date, startHours), startMinutes),
          0
        ),
        0
      );
      const endDateTime = setMilliseconds(
        setSeconds(setMinutes(setHours(data.date, endHours), endMinutes), 0),
        0
      );

      // Validate session date and time
      const dateTimeValidation = validateSessionDateTime(
        startDateTime.toISOString(),
        endDateTime.toISOString()
      );

      if (!dateTimeValidation.isValid) {
        handleError(
          new Error(dateTimeValidation.error || "Invalid session timing"),
          {
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
          }
        );
        return;
      }

      // Create topic in Supabase with retry logic and timeout protection
      const createTopicPromise = executeWithRetry(
        () =>
          topicService.createTopic({
            title: validationResult.sanitized.title,
            description: validationResult.sanitized.description,
            author_id: user.uid,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            participants: [], // Start with empty participants - author is separate
            requests: [],
          }),
        "createSession",
        ErrorType.NETWORK
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session creation timeout')), 20000)
      );
      
      const createdTopic = await Promise.race([createTopicPromise, timeoutPromise]);

      // Show success toast and close dialog immediately
      showSessionCreatedSuccess(
        (createdTopic as any)?.id || "unknown",
        validationResult.sanitized.title
      );

      if (onSessionCreated) {
        onSessionCreated();
      }

      form.reset();
      setCalculatedDuration(null);
      setValidationErrors({});
      setShowSuccess(false);
      setOpen(false);
      setShowCalendar(false);
    } catch (error) {
      handleError(error, {
        operation: "createSession",
        userId: user.uid,
        topicTitle: data.topic,
        sessionDate: data.date?.toISOString(),
      });
    }
  };

  // AI Topic Helper function
  const handleAIHelp = async () => {
    if (!aiInput.trim()) {
      toast({
        title: "Input required",
        description: "Please describe what you'd like to talk about",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const response = await aiService.chat([
        {
          role: "system",
          content: `You are a helpful assistant for Harthio, a platform for meaningful conversations. Your task is to help users create session topics.

When a user provides rough thoughts about what they want to discuss, you should:
1. Generate a clear, concise session topic (5-15 words)
2. Write a helpful description (20-50 words)
3. Suggest 2-3 alternative topic ideas based on their input

Format your response EXACTLY like this:
TOPIC: [clear topic title]
DESCRIPTION: [helpful description]
SUGGESTIONS:
- [alternative topic 1]
- [alternative topic 2]
- [alternative topic 3]

Keep topics professional, empathetic, and focused on meaningful conversation. Avoid clinical language.`,
        },
        {
          role: "user",
          content: `Help me create a session topic. Here's what I'm thinking: ${aiInput}`,
        },
      ]);

      if (response.success && response.message) {
        // Parse the AI response
        const topicMatch = response.message.match(/TOPIC:\s*(.+)/);
        const descMatch = response.message.match(/DESCRIPTION:\s*(.+)/);
        const suggestionsMatch = response.message.match(/SUGGESTIONS:\s*([\s\S]+)/);

        if (topicMatch && descMatch) {
          // Auto-fill the form
          form.setValue("topic", topicMatch[1].trim());
          form.setValue("description", descMatch[1].trim());

          // Extract suggestions
          if (suggestionsMatch) {
            const suggestions = suggestionsMatch[1]
              .split("\n")
              .filter((line) => line.trim().startsWith("-"))
              .map((line) => line.replace(/^-\s*/, "").trim())
              .filter((s) => s.length > 0);
            setAiSuggestions(suggestions);
          }

          toast({
            title: "✨ Topic generated!",
            description: "Review and edit as needed",
          });
        } else {
          throw new Error("Could not parse AI response");
        }
      } else {
        throw new Error(response.error || "AI request failed");
      }
    } catch (error: any) {
      console.error("AI helper error:", error);
      toast({
        title: "AI helper unavailable",
        description: "Please create your topic manually",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    form.setValue("topic", suggestion);
    setAiSuggestions([]);
    toast({
      title: "Topic applied",
      description: "Feel free to edit it further",
    });
  };

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setShowSuccess(false);
      setValidationErrors({});
      setShowCalendar(false);
      setShowTimePicker(null);
      setShowAIHelper(false);
      setAiInput("");
      setAiSuggestions([]);
      clearError();
    }
  }, [open, clearError]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg flex flex-col p-0">
        {/* Header - Fixed at top */}
        <DialogHeader className="flex-shrink-0 px-4 pt-8 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Schedule a Session
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-sm font-medium text-gray-900 mb-0">
                        Session Topic <span className="text-red-500">*</span>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAIHelper(!showAIHelper)}
                        className="h-6 px-2 sm:h-7 sm:px-2.5 text-xs text-accent hover:text-accent/80 hover:bg-accent/10 gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Write with AI</span>
                      </Button>
                    </div>
                    {showAIHelper && (
                      <div className="space-y-4 p-4 sm:p-5 mb-4 bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border border-accent/20 shadow-apple-sm animate-in slide-in-from-top-2 duration-apple">
                        <div className="space-y-2.5">
                          <label className="text-sm font-medium text-gray-900">
                            What's on your mind?
                          </label>
                          <Textarea
                            placeholder="Type anything you're thinking... AI will help organize it into a clear topic and description"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            disabled={aiLoading}
                            className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleAIHelp}
                          disabled={aiLoading || !aiInput.trim()}
                          className="w-full h-10 sm:h-11 text-sm font-medium bg-accent hover:bg-accent/90 text-accent-foreground active:scale-[0.98] transition-all duration-apple"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate
                            </>
                          )}
                        </Button>

                        {aiSuggestions.length > 0 && (
                          <div className="space-y-2.5 pt-3 border-t border-accent/20">
                            <p className="text-sm font-medium text-gray-900">
                              Alternative topics:
                            </p>
                            <div className="space-y-2">
                              {aiSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => applySuggestion(suggestion)}
                                  className="w-full text-left text-sm sm:text-base p-3 sm:p-3.5 rounded-lg bg-white hover:bg-accent/5 border border-accent/30 hover:border-accent/50 transition-all duration-apple active:scale-[0.98] shadow-apple-sm"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <FormControl>
                      <Input
                        placeholder="e.g., Venting about a co-founder"
                        disabled={form.formState.isSubmitting}
                        className="h-11 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    {validationErrors.title && (
                      <p className="text-xs text-destructive">
                        {validationErrors.title}
                      </p>
                    )}
                    <div className="flex justify-end text-xs text-muted-foreground">
                      <span>{field.value?.length || 0}/100</span>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Description <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's the session about?"
                        disabled={form.formState.isSubmitting}
                        className="min-h-[100px] text-base resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    {validationErrors.description && (
                      <p className="text-xs text-destructive">
                        {validationErrors.description}
                      </p>
                    )}
                    <div className="flex justify-end text-xs text-muted-foreground">
                      <span>{field.value?.length || 0}/500</span>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium text-gray-900">Date <span className="text-red-500">*</span></FormLabel>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full h-11 justify-start text-left font-normal text-base",
                        !field.value && "text-muted-foreground"
                      )}
                      onClick={() => setShowCalendar(true)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">Start Time <span className="text-red-500">*</span></FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 justify-start text-left font-normal text-base"
                        onClick={() => setShowTimePicker('start')}
                      >
                        {field.value || "Select time"}
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">End Time <span className="text-red-500">*</span></FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 justify-start text-left font-normal text-base"
                        onClick={() => setShowTimePicker('end')}
                      >
                        {field.value || "Select time"}
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Hidden old time picker - keeping the Select logic for desktop fallback */}
              <div className="hidden">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">Start Time <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Parse the selected time and update individual fields
                          const [time, period] = value.split(" ");
                          const [hour, minute] = time.split(":");
                          form.setValue("startHour", hour);
                          form.setValue("startMinute", minute);
                          form.setValue("startPeriod", period);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select start time">
                              {field.value && (
                                <span>
                                  {field.value
                                    .replace(":", ":")
                                    .replace(" ", " ")}
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-48">
                          <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1 px-2">
                            <div className="text-center">Hr</div>
                            <div className="text-center">Min</div>
                            <div className="text-center">AM/PM</div>
                          </div>
                          <div className="grid grid-cols-3 max-h-32 overflow-hidden border-t">
                            {/* Hours Column */}
                            <div className="max-h-32 overflow-y-auto border-r">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (hour) => {
                                  const isSelected =
                                    form.getValues("startHour") ===
                                    hour.toString();
                                  return (
                                    <div
                                      key={`start-hour-${hour}`}
                                      className={`text-center text-xs py-2 cursor-pointer hover:bg-accent transition-colors relative ${
                                        isSelected
                                          ? "bg-primary/10 border-l-2 border-primary"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        const currentMinute =
                                          form.getValues("startMinute") || "00";
                                        const currentPeriod =
                                          form.getValues("startPeriod") || "AM";
                                        const timeValue = `${hour
                                          .toString()
                                          .padStart(
                                            2,
                                            "0"
                                          )}:${currentMinute} ${currentPeriod}`;
                                        field.onChange(timeValue);
                                        form.setValue(
                                          "startHour",
                                          hour.toString()
                                        );
                                      }}
                                    >
                                      {hour.toString().padStart(2, "0")}
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {/* Minutes Column */}
                            <div className="max-h-32 overflow-y-auto border-r">
                              {Array.from({ length: 60 }, (_, i) =>
                                i.toString().padStart(2, "0")
                              ).map((minute) => {
                                const isSelected =
                                  form.getValues("startMinute") === minute;
                                return (
                                  <div
                                    key={`start-minute-${minute}`}
                                    className={`text-center text-xs py-2 cursor-pointer hover:bg-accent transition-colors relative ${
                                      isSelected
                                        ? "bg-primary/10 border-l-2 border-primary"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      const currentHour =
                                        form.getValues("startHour") || "1";
                                      const currentPeriod =
                                        form.getValues("startPeriod") || "AM";
                                      const timeValue = `${currentHour.padStart(
                                        2,
                                        "0"
                                      )}:${minute} ${currentPeriod}`;
                                      field.onChange(timeValue);
                                      form.setValue("startMinute", minute);
                                    }}
                                  >
                                    {minute}
                                  </div>
                                );
                              })}
                            </div>

                            {/* AM/PM Column */}
                            <div className="max-h-32 overflow-y-auto">
                              {["AM", "PM"].map((period) => {
                                const isSelected =
                                  form.getValues("startPeriod") === period;
                                return (
                                  <div
                                    key={`start-period-${period}`}
                                    className={`text-center text-xs py-2 cursor-pointer hover:bg-accent transition-colors relative ${
                                      isSelected
                                        ? "bg-primary/10 border-l-2 border-primary"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      const currentHour =
                                        form.getValues("startHour") || "1";
                                      const currentMinute =
                                        form.getValues("startMinute") || "00";
                                      const timeValue = `${currentHour.padStart(
                                        2,
                                        "0"
                                      )}:${currentMinute} ${period}`;
                                      field.onChange(timeValue);
                                      form.setValue("startPeriod", period);
                                    }}
                                  >
                                    {period}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900">End Time <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Parse the selected time and update individual fields
                          const [time, period] = value.split(" ");
                          const [hour, minute] = time.split(":");
                          form.setValue("endHour", hour);
                          form.setValue("endMinute", minute);
                          form.setValue("endPeriod", period);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select end time">
                              {field.value && (
                                <span>
                                  {field.value
                                    .replace(":", ":")
                                    .replace(" ", " ")}
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-48">
                          <div className="grid grid-cols-3 text-xs text-muted-foreground mb-1 px-2">
                            <div className="text-center">Hr</div>
                            <div className="text-center">Min</div>
                            <div className="text-center">AM/PM</div>
                          </div>
                          <div className="grid grid-cols-3 max-h-32 overflow-hidden border-t">
                            {/* Hours Column */}
                            <div className="max-h-32 overflow-y-auto border-r">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (hour) => {
                                  const isSelected =
                                    form.getValues("endHour") ===
                                    hour.toString();
                                  return (
                                    <div
                                      key={`end-hour-${hour}`}
                                      className={`text-center text-xs py-2 cursor-pointer hover:bg-accent transition-colors relative ${
                                        isSelected
                                          ? "bg-primary/10 border-l-2 border-primary"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        const currentMinute =
                                          form.getValues("endMinute") || "00";
                                        const currentPeriod =
                                          form.getValues("endPeriod") || "AM";
                                        const timeValue = `${hour
                                          .toString()
                                          .padStart(
                                            2,
                                            "0"
                                          )}:${currentMinute} ${currentPeriod}`;
                                        field.onChange(timeValue);
                                        form.setValue(
                                          "endHour",
                                          hour.toString()
                                        );
                                      }}
                                    >
                                      {hour.toString().padStart(2, "0")}
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {/* Minutes Column */}
                            <div className="max-h-32 overflow-y-auto border-r">
                              {Array.from({ length: 60 }, (_, i) =>
                                i.toString().padStart(2, "0")
                              ).map((minute) => {
                                const isSelected =
                                  form.getValues("endMinute") === minute;
                                return (
                                  <div
                                    key={`end-minute-${minute}`}
                                    className={`text-center text-xs py-2 cursor-pointer hover:bg-accent transition-colors relative ${
                                      isSelected
                                        ? "bg-primary/10 border-l-2 border-primary"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      const currentHour =
                                        form.getValues("endHour") || "1";
                                      const currentPeriod =
                                        form.getValues("endPeriod") || "AM";
                                      const timeValue = `${currentHour.padStart(
                                        2,
                                        "0"
                                      )}:${minute} ${currentPeriod}`;
                                      field.onChange(timeValue);
                                      form.setValue("endMinute", minute);
                                    }}
                                  >
                                    {minute}
                                  </div>
                                );
                              })}
                            </div>

                            {/* AM/PM Column */}
                            <div className="max-h-32 overflow-y-auto">
                              {["AM", "PM"].map((period) => {
                                const isSelected =
                                  form.getValues("endPeriod") === period;
                                return (
                                  <div
                                    key={`end-period-${period}`}
                                    className={`text-center text-xs py-2 cursor-pointer hover:bg-accent transition-colors relative ${
                                      isSelected
                                        ? "bg-primary/10 border-l-2 border-primary"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      const currentHour =
                                        form.getValues("endHour") || "1";
                                      const currentMinute =
                                        form.getValues("endMinute") || "00";
                                      const timeValue = `${currentHour.padStart(
                                        2,
                                        "0"
                                      )}:${currentMinute} ${period}`;
                                      field.onChange(timeValue);
                                      form.setValue("endPeriod", period);
                                    }}
                                  >
                                    {period}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {calculatedDuration && (
                <div className="flex items-center gap-2.5 text-sm p-3 bg-primary/5 text-primary rounded-xl border border-primary/20">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span><span className="font-semibold">Duration:</span> {calculatedDuration}</span>
                </div>
              )}

              {/* Schedule Conflict Warning */}
              {conflictResult?.hasConflict && (
                <ScheduleConflictWarning 
                  conflictResult={conflictResult}
                />
              )}
            </form>
          </Form>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={form.formState.isSubmitting}
              className="px-5 h-11 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={
                form.formState.isSubmitting ||
                Object.keys(validationErrors).length > 0 ||
                conflictResult?.hasConflict
              }
              className="px-6 h-11 text-sm font-medium active:scale-[0.98] transition-all duration-apple"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Schedule Session"
              )}
            </Button>
          </div>
        </div>

        {/* Full-screen Calendar Overlay (Mobile only) */}
        {showCalendar && (
          <div className="sm:hidden fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-apple">
            <div className="flex flex-col h-full">
              {/* Calendar Header */}
              <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Date</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Calendar Content */}
              <div className="flex-1 flex items-center justify-center p-4">
                <Calendar
                  mode="single"
                  captionLayout="buttons"
                  fromDate={new Date()}
                  toDate={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() + 2)
                    )
                  }
                  selected={form.watch("date")}
                  onSelect={(date) => {
                    if (date) {
                      form.setValue("date", date);
                      setShowCalendar(false);
                    }
                  }}
                  disabled={(date) =>
                    date <
                    new Date(new Date().setDate(new Date().getDate() - 1))
                  }
                  className="scale-110"
                  initialFocus
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Calendar Popover */}
        {showCalendar && (
          <div className="hidden sm:block absolute inset-0 z-[60] bg-black/20 backdrop-blur-sm" onClick={() => setShowCalendar(false)}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-white rounded-xl border border-gray-200 shadow-apple animate-in zoom-in-95 duration-apple" onClick={(e) => e.stopPropagation()}>
              <Calendar
                mode="single"
                captionLayout="buttons"
                fromDate={new Date()}
                toDate={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() + 2)
                  )
                }
                selected={form.watch("date")}
                onSelect={(date) => {
                  if (date) {
                    form.setValue("date", date);
                    setShowCalendar(false);
                  }
                }}
                disabled={(date) =>
                  date <
                  new Date(new Date().setDate(new Date().getDate() - 1))
                }
                initialFocus
              />
            </div>
          </div>
        )}

        {/* Full-screen Time Picker Overlay (Mobile) / Centered Modal (Desktop) */}
        {showTimePicker && (
          <div className="fixed inset-0 z-[100] bg-white sm:bg-black/20 sm:backdrop-blur-sm animate-in slide-in-from-bottom sm:fade-in duration-apple" onClick={(e) => {
            if (e.target === e.currentTarget) setShowTimePicker(null);
          }}>
            <div className="flex flex-col h-full sm:h-auto sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bg-white sm:rounded-xl sm:shadow-apple sm:max-w-md sm:w-full sm:mx-4">
              {/* Time Picker Header */}
              <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 flex items-center justify-between sm:rounded-t-xl">
                <h3 className="text-lg font-semibold">
                  {showTimePicker === 'start' ? 'Start Time' : 'End Time'}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimePicker(null)}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Time Picker Content */}
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-sm">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium text-gray-600 mb-4">
                    <div>Hour</div>
                    <div>Minute</div>
                    <div>AM/PM</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Hours */}
                    <div className="h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                        const fieldName = showTimePicker === 'start' ? 'startHour' : 'endHour';
                        const isSelected = form.getValues(fieldName) === hour.toString();
                        return (
                          <button
                            key={hour}
                            type="button"
                            className={cn(
                              "w-full py-4 text-lg transition-all duration-apple",
                              isSelected
                                ? "bg-primary text-white font-semibold"
                                : "hover:bg-gray-100 active:bg-gray-200"
                            )}
                            onClick={() => {
                              const minuteField = showTimePicker === 'start' ? 'startMinute' : 'endMinute';
                              const periodField = showTimePicker === 'start' ? 'startPeriod' : 'endPeriod';
                              const timeField = showTimePicker === 'start' ? 'startTime' : 'endTime';
                              
                              const minute = form.getValues(minuteField) || "00";
                              const period = form.getValues(periodField) || "AM";
                              const timeValue = `${hour.toString().padStart(2, "0")}:${minute} ${period}`;
                              
                              form.setValue(fieldName, hour.toString());
                              form.setValue(timeField, timeValue);
                            }}
                          >
                            {hour.toString().padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>

                    {/* Minutes */}
                    <div className="h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50">
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => {
                        const minuteStr = minute.toString().padStart(2, "0");
                        const fieldName = showTimePicker === 'start' ? 'startMinute' : 'endMinute';
                        const isSelected = form.getValues(fieldName) === minuteStr;
                        return (
                          <button
                            key={minute}
                            type="button"
                            className={cn(
                              "w-full py-4 text-lg transition-all duration-apple",
                              isSelected
                                ? "bg-primary text-white font-semibold"
                                : "hover:bg-gray-100 active:bg-gray-200"
                            )}
                            onClick={() => {
                              const hourField = showTimePicker === 'start' ? 'startHour' : 'endHour';
                              const periodField = showTimePicker === 'start' ? 'startPeriod' : 'endPeriod';
                              const timeField = showTimePicker === 'start' ? 'startTime' : 'endTime';
                              
                              const hour = form.getValues(hourField) || "1";
                              const period = form.getValues(periodField) || "AM";
                              const timeValue = `${hour.padStart(2, "0")}:${minuteStr} ${period}`;
                              
                              form.setValue(fieldName, minuteStr);
                              form.setValue(timeField, timeValue);
                            }}
                          >
                            {minuteStr}
                          </button>
                        );
                      })}
                    </div>

                    {/* AM/PM */}
                    <div className="h-64 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50">
                      {["AM", "PM"].map((period) => {
                        const fieldName = showTimePicker === 'start' ? 'startPeriod' : 'endPeriod';
                        const isSelected = form.getValues(fieldName) === period;
                        return (
                          <button
                            key={period}
                            type="button"
                            className={cn(
                              "w-full py-4 text-lg transition-all duration-apple",
                              isSelected
                                ? "bg-primary text-white font-semibold"
                                : "hover:bg-gray-100 active:bg-gray-200"
                            )}
                            onClick={() => {
                              const hourField = showTimePicker === 'start' ? 'startHour' : 'endHour';
                              const minuteField = showTimePicker === 'start' ? 'startMinute' : 'endMinute';
                              const timeField = showTimePicker === 'start' ? 'startTime' : 'endTime';
                              
                              const hour = form.getValues(hourField) || "1";
                              const minute = form.getValues(minuteField) || "00";
                              const timeValue = `${hour.padStart(2, "0")}:${minute} ${period}`;
                              
                              form.setValue(fieldName, period);
                              form.setValue(timeField, timeValue);
                            }}
                          >
                            {period}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Done Button */}
                  <Button
                    type="button"
                    onClick={() => setShowTimePicker(null)}
                    className="w-full mt-6 h-12 text-base"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
