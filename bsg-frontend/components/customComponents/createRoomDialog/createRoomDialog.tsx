"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {z} from "zod";

import {Button} from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Checkbox} from "@/components/ui/checkbox";
import {DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import Topic from "../Topic/Topic";
import TopicButtonGroup from "../topicButtonGroup/topicButtonGroup";
import Difficulty from "@/app/models/Difficulty";
import DifficultyButton from "../difficultyButtonGroup/difficultyButton";

const topics = [
  {id: "arrays", name: "Arrays", numberOfProblems: 214, isSelected: false},
  {
    id: "linked-list",
    name: "Linked List",
    numberOfProblems: 214,
    isSelected: false,
  },
  {
    id: "two-pointers",
    name: "Two Pointers",
    numberOfProblems: 214,
    isSelected: false,
  },
  {id: "stack", name: "Stack", numberOfProblems: 214, isSelected: false},
  {
    id: "binary-search",
    name: "Binary Search",
    numberOfProblems: 214,
    isSelected: false,
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    numberOfProblems: 214,
    isSelected: false,
  },
  {
    id: "backtracking",
    name: "Backtracking",
    numberOfProblems: 214,
    isSelected: false,
  },
] as const;

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  // difficulty: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"], {
    required_error: "Please select a difficulty.",
  }),
  topics: z.array(z.string()).refine((value) => value.some((topic) => topic), {
    message: "You have to select at least one topic.",
  }),
});

export function CreateRoomDialog() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      difficulty: Difficulty.Easy,
      topics: [],
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }
  return (
    <DialogContent className="md:max-w-[525px]">
      <DialogHeader>
        <DialogTitle className="text-xl">Create room</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({field}) => (
              <FormItem>
                <FormLabel>Room name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter room name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="difficulty"
            render={({field}) => (
              <FormItem className="space-y-1">
                <FormLabel>Theme</FormLabel>
                <FormMessage />
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-2 pt-2">
                  <FormItem>
                    <FormLabel className="[&:has([data-state=checked])>div]:bg-green-500">
                      <FormControl>
                        <RadioGroupItem value="Easy" className="sr-only" />
                      </FormControl>
                      <div className="items-center rounded-full p-1 px-4 bg-gray-500 hover:bg-gray-700 cursor-pointer">
                        <span className="block w-full p-2 text-center font-normal">
                          Easy
                        </span>
                      </div>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormLabel className="[&:has([data-state=checked])>div]:bg-yellow-500">
                      <FormControl>
                        <RadioGroupItem value="Medium" className="sr-only" />
                      </FormControl>
                      <div className="items-center rounded-full p-1 px-4 bg-gray-500 hover:bg-gray-700 cursor-pointer">
                        <span className="block w-full p-2 text-center font-normal">
                          Medium
                        </span>
                      </div>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormLabel className="[&:has([data-state=checked])>div]:bg-red-500">
                      <FormControl>
                        <RadioGroupItem value="Hard" className="sr-only" />
                      </FormControl>
                      <div className="items-center rounded-full p-1 px-4 bg-gray-500 hover:bg-gray-700 cursor-pointer">
                        <span className="block w-full p-2 text-center font-normal">
                          Hard
                        </span>
                      </div>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="topics"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Topics</FormLabel>
                </div>
                <div className="flex w-full gap-4 flex-wrap overflow-y-auto">
                  {topics.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="topics"
                      render={({field}) => {
                        return (
                          <FormItem key={item.id} className="space-y-3">
                            <FormLabel className="[&:has([data-state=checked])>div]:bg-primary">
                              <FormControl>
                                <Checkbox
                                  className="sr-only"
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          item.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="items-center rounded-full p-1 bg-gray-500 hover:bg-gray-700 cursor-pointer">
                                <span className="block w-full p-2 text-center font-normal">
                                  {item.name}
                                </span>
                              </div>
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </DialogContent>
  );
}
