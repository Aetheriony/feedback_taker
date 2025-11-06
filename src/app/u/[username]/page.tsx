'use client';

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardHeader, CardContent, Card } from '@/components/ui/card';
import { useCompletion } from 'ai/react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import * as z from 'zod';
import { ApiResponse } from '@/types/ApiResponse';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { messageSchema } from '@/schemas/messageSchema';

const specialChar = '||';

const parseStringMessages = (messageString: string): string[] => {
  return messageString.split(specialChar);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

export default function SendMessage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const {
    complete,
    completion,
    isLoading: isSuggestLoading,
    error,
  } = useCompletion({
    api: '/api/suggest-messages',
    initialCompletion: initialMessageString,
  });

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  const messageContent = form.watch('content');

  const handleMessageClick = (message: string) => {
    form.setValue('content', message);
  };

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post<ApiResponse>('/api/send-message', {
        ...data,
        username,
      });

      toast({
        title: response.data.message,
        variant: 'default',
      });
      form.reset({ ...form.getValues(), content: '' });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ?? 'Failed to sent message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedMessages = async () => {
    try {
      complete('');
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Handle error appropriately
    }
  };

  const cleanMessage = (msg: string) => {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(msg);
      if (parsed.code) return parsed.code.trim();
      if (parsed.message) return parsed.message.trim();
      return msg.trim();
    } catch {
      // Remove curly braces, quotes, and prefixes like "code:"
      return msg
        .replace(/[{}"]/g, '') // remove braces and quotes
        .replace(/^code\s*:\s*/i, '') // remove "code:" prefix (case insensitive)
        .replace(/^message\s*:\s*/i, '') // remove "message:" prefix if any
        .trim();
    }
  };


  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Public Profile Link
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Send Anonymous Message to @{username}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your anonymous message here"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-center">
            {isLoading ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading || !messageContent}>
                Send It
              </Button>
            )}
          </div>
        </form>
      </Form>

      <div className="my-10 space-y-6">
        {/* Header and Suggest Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Suggested Messages</h2>
            <p className="text-sm text-muted-foreground">
              Click on any message below to select it.
            </p>
          </div>
          <Button
            onClick={fetchSuggestedMessages}
            disabled={isSuggestLoading}
            className="w-full sm:w-auto"
          >
            {isSuggestLoading ? "Loading..." : "Suggest Messages"}
          </Button>
        </div>

        {/* Message List */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <h3 className="text-lg font-semibold">Messages</h3>
          </CardHeader>
          <CardContent className="flex flex-col space-y-3">
            {error ? (
              <p className="text-sm text-red-500 font-medium">{error.message}</p>
            ) : parseStringMessages(completion).length > 0 ? (
              parseStringMessages(completion).map((message, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left hover:bg-gray-50 transition"
                  onClick={() => handleMessageClick(cleanMessage(message))}
                >
                  {cleanMessage(message)}
                </Button>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No messages yet. Click "Suggest Messages" to generate some!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />
      <div className="text-center">
        <div className="mb-4">Get Your Message Board</div>
        <Link href={'/sign-up'}>
          <Button>Create Your Account</Button>
        </Link>
      </div>
    </div>
  );
}
