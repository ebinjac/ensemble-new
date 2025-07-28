
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Search,
  BookOpen,
  Video,
  MessageSquare,
  Mail,
  Users,
  Settings,
  BarChart3,
  HelpCircle,
  ExternalLink,
  Play,
  Download,
  FileText,
  Send,
  Eye,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';

interface HelpViewProps {
  teamId: string;
}

const quickStartGuides = [
  {
    title: 'Getting Started with Bluemailer',
    description: 'Learn the basics of creating and sending email campaigns',
    icon: Zap,
    duration: '5 min read',
    difficulty: 'Beginner',
  },
  {
    title: 'Creating Your First Template',
    description: 'Step-by-step guide to building email templates',
    icon: Mail,
    duration: '10 min read',
    difficulty: 'Beginner',
  },
  {
    title: 'Setting Up SMTP Configuration',
    description: 'Configure your email sending settings',
    icon: Settings,
    duration: '8 min read',
    difficulty: 'Intermediate',
  },
  {
    title: 'Understanding Analytics',
    description: 'Track and analyze your email performance',
    icon: BarChart3,
    duration: '12 min read',
    difficulty: 'Intermediate',
  },
];

const faqs = [
  {
    question: 'How do I set up my SMTP configuration?',
    answer: 'Go to Settings > Email Settings and click "Add Configuration". Enter your SMTP server details including host, port, and authentication credentials. You can test the configuration before saving.',
    category: 'Email Setup'
  },
  {
    question: 'Why are my emails not being sent?',
    answer: 'Check your SMTP configuration is correct, ensure your email service is active, and verify that your emails are not stuck in the queue. You can also check the email history for error messages.',
    category: 'Troubleshooting'
  },
  {
    question: 'How do I track email opens?',
    answer: 'Email tracking is automatically enabled when you send emails. You can view open rates and engagement metrics in the Analytics section.',
    category: 'Analytics'
  },
  {
    question: 'Can I schedule emails to be sent later?',
    answer: 'Yes, when sending an email, you can select a future date and time for delivery. The email will be queued and sent automatically at the specified time.',
    category: 'Email Sending'
  },
  {
    question: 'How do I add team members?',
    answer: 'Go to Settings > Team Members and click "Invite Member". Enter their email address and select their role. They\'ll receive an invitation email to join your team.',
    category: 'Team Management'
  },
  {
    question: 'What file types can I attach to emails?',
    answer: 'You can attach PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT, and CSV files up to 10MB each.',
    category: 'Email Sending'
  },
  {
    question: 'How do I duplicate a template?',
    answer: 'In the Templates page, click the three dots menu on any template and select "Duplicate". This will create a copy that you can modify.',
    category: 'Templates'
  },
  {
    question: 'Can I export my email analytics?',
    answer: 'Yes, you can export analytics data from the Analytics page using the "Export Report" button. Data is available in CSV format.',
    category: 'Analytics'
  }
];

const videoTutorials = [
  {
    title: 'Bluemailer Overview',
    description: 'A comprehensive overview of Bluemailer features',
    duration: '8:30',
    thumbnail: '/videos/overview-thumb.jpg',
    videoId: 'overview'
  },
  {
    title: 'Creating Email Templates',
    description: 'Learn to create beautiful email templates',
    duration: '12:45',
    thumbnail: '/videos/templates-thumb.jpg',
    videoId: 'templates'
  },
  {
    title: 'Email Analytics Deep Dive',
    description: 'Understanding your email performance metrics',
    duration: '15:20',
    thumbnail: '/videos/analytics-thumb.jpg',
    videoId: 'analytics'
  },
];

export function HelpView({ teamId }: HelpViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  return (
    <div className="space-y-6">
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold mb-2">Documentation</h3>
            <p className="text-sm text-gray-600">Comprehensive guides and API documentation</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold mb-2">Video Tutorials</h3>
            <p className="text-sm text-gray-600">Step-by-step video guides</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600">Get help from our support team</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Help Content */}
      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Quick Start Guides</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {quickStartGuides.map((guide, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <guide.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{guide.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {guide.duration}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {guide.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Email Management</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Create and manage email templates</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Send emails to multiple recipients</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Schedule emails for later delivery</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Attach files to emails</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Analytics & Tracking</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Track email delivery and opens</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>View detailed analytics</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Export performance reports</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Monitor template performance</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center space-x-2">
                        <span>{faq.question}</span>
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-600">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Tutorials Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Video Tutorials</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {videoTutorials.map((video, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-400" />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium mb-1">{video.title}</h3>
                      <p className="text-sm text-gray-600">{video.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">support@bluemailer.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-gray-600">Available 9 AM - 5 PM EST</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Knowledge Base</p>
                    <p className="text-sm text-gray-600">Self-service documentation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download User Manual
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Button>
                <Button className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
