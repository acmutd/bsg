import { useState } from 'react';
import { Button } from '@bsg/ui/button';
import { SERVER_URL } from '@/lib/config';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      setErrorMessage('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // const res = await fetch(`http://localhost:5000/api/feedback/`, {
      //   method: 'POST',
      //   body: JSON.stringify({ feedbackText: feedbackText.trim() }),
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      // });

      // if (!res.ok) {
      //   const data = await res.json();
      //   throw new Error(data.message || 'Failed to submit feedback');
      // }

      setSubmitStatus('success');
      setFeedbackText('');
      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg p-6 w-[400px] flex flex-col gap-4 max-h-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">We value your feedback!</h2>

        <p className="text-sm text-foreground/80">
          Please let us know your thoughts, suggestions, or any issues you've encountered while using our extension.
          Your feedback helps us improve and provide a better experience for you and other users.
        </p>

        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Type your feedback here..."
          className="w-full border border-foreground/20 rounded-md p-3 bg-inputBackground text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={6}
          disabled={isSubmitting}
        />

        {submitStatus === 'success' && (
          <div className="p-3 bg-green-500/20 text-green-400 rounded-md text-sm">
            Thank you! Your feedback has been submitted successfully!
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-3 bg-red-500/20 text-red-400 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button
            onClick={onClose}
            className="rounded-lg px-4 py-2 bg-transparent border border-foreground/20 hover:bg-foreground/10"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-lg px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground"
            disabled={isSubmitting || feedbackText.trim() === ''}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </div>
    </div>
  );
};