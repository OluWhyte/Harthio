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
} from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useAuth } from "@/hooks/use-auth";
import { topicService } from "@/lib/supabase-services";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorType } from "@/lib/error-utils";
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

      // Create topic in Supabase with retry logic
      const createdTopic = await executeWithRetry(
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

      // Show success toast and close dialog immediately
      showSessionCreatedSuccess(
        createdTopic?.id || "unknown",
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

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setShowSuccess(false);
      setValidationErrors({});
      setShowCalendar(false);
      clearError();
    }
  }, [open, clearError]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Schedule a New Session</DialogTitle>
          <DialogDescription>
            Fill out the details below to create a new session for others to
            join.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Topic</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Venting about a co-founder"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {validationErrors.title && (
                      <p className="text-sm text-destructive">
                        {validationErrors.title}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {field.value?.length || 0}/100 characters
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's the session about? What will participants gain by joining?"
                        className="resize-none"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {validationErrors.description && (
                      <p className="text-sm text-destructive">
                        {validationErrors.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {field.value?.length || 0}/500 characters
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                    {showCalendar && (
                      <Calendar
                        mode="single"
                        captionLayout="buttons"
                        fromDate={new Date()}
                        toDate={
                          new Date(
                            new Date().setFullYear(new Date().getFullYear() + 2)
                          )
                        }
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) field.onChange(date);
                          setShowCalendar(false);
                        }}
                        disabled={(date) =>
                          date <
                          new Date(new Date().setDate(new Date().getDate() - 1))
                        }
                        initialFocus
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
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
                      <FormLabel>End Time</FormLabel>
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
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  <span className="font-semibold">Duration:</span>{" "}
                  {calculatedDuration}
                </div>
              )}
              <DialogFooter className="flex-shrink-0 pt-4 flex-row justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={form.formState.isSubmitting}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting ||
                    Object.keys(validationErrors).length > 0
                  }
                  className="px-6"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Session"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
