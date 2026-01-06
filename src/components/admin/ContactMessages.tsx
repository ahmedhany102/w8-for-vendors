
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import { Trash, Eye } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    loadMessages();
  }, []);
  
  const loadMessages = () => {
    try {
      const storedMessages = localStorage.getItem('contactMessages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading contact messages:', error);
      toast.error('فشل في تحميل الرسائل');
    }
  };
  
  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewDialogOpen(true);
    
    // Mark message as read
    if (!message.read) {
      const updatedMessages = messages.map(msg => 
        msg.id === message.id ? { ...msg, read: true } : msg
      );
      setMessages(updatedMessages);
      localStorage.setItem('contactMessages', JSON.stringify(updatedMessages));
    }
  };
  
  const handleDeleteMessage = () => {
    if (!selectedMessage) return;
    
    try {
      const updatedMessages = messages.filter(msg => msg.id !== selectedMessage.id);
      setMessages(updatedMessages);
      localStorage.setItem('contactMessages', JSON.stringify(updatedMessages));
      
      toast.success('تم حذف الرسالة بنجاح');
      setIsDeleteDialogOpen(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('فشل في حذف الرسالة');
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (error) {
      return 'غير معروف';
    }
  };

  return (
    <Card className="border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-900 to-black text-white">
        <CardTitle className="text-xl">رسائل التواصل</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 bg-gray-50">
            <p className="text-gray-500">لا توجد رسائل</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-green-50">
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id} className={message.read ? '' : 'bg-blue-50'}>
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{message.subject}</TableCell>
                    <TableCell>{formatTimeAgo(message.timestamp)}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs text-white ${message.read ? 'bg-gray-500' : 'bg-green-600'}`}>
                        {message.read ? 'مقروءة' : 'جديدة'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewMessage(message)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedMessage(message);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* View Message Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تفاصيل الرسالة</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">الاسم:</span> {selectedMessage.name}
                  </div>
                  <div>
                    <span className="font-semibold">البريد الإلكتروني:</span>{' '}
                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">الموضوع:</span> {selectedMessage.subject}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">التاريخ:</span> {formatTimeAgo(selectedMessage.timestamp)}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <span className="font-semibold block mb-2">الرسالة:</span>
                  <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap">{selectedMessage.message}</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                إغلاق
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsDeleteDialogOpen(true);
                }}
              >
                حذف الرسالة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد حذف الرسالة</DialogTitle>
            </DialogHeader>
            <p className="py-4">هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteMessage}
              >
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ContactMessages;
