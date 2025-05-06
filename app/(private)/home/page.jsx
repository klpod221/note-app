"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Statistic, Space, Empty, List, Skeleton } from "antd";
import {
  PlusOutlined,
  FileOutlined,
  EditOutlined,
  ClockCircleOutlined,
  StarOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import useCurrentUser from "@/hooks/useCurrentUser";
import { fetchNoteStatistics } from "@/services/noteService";

export default function Home() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // Set greeting based on time of day with more interesting variations
    const hour = new Date().getHours();

    // Arrays of varied greetings by time of day
    const morningGreetings = [
      "Good morning",
      "Rise and shine",
      "Top of the morning",
      "Hello, sunshine",
      "Morning glory",
    ];

    const afternoonGreetings = [
      "Good afternoon",
      "Having a good day",
      "Afternoon delight",
      "Hey there",
      "Keep going strong",
    ];

    const eveningGreetings = [
      "Good evening",
      "Evening greetings",
      "Winding down",
      "Hello there",
      "Peaceful evening",
    ];

    let greetingsArray;
    if (hour >= 5 && hour < 12) {
      greetingsArray = morningGreetings;
    } else if (hour >= 12 && hour < 18) {
      greetingsArray = afternoonGreetings;
    } else {
      greetingsArray = eveningGreetings;
    }

    // Select random greeting from the appropriate array
    const randomIndex = Math.floor(Math.random() * greetingsArray.length);
    setGreeting(greetingsArray[randomIndex]);
  }, []);

  useEffect(() => {
    const getStatistics = async () => {
      setLoading(true);
      try {
        const result = await fetchNoteStatistics();
        if (result.success) {
          setStats(result.stats);
          setRecentNotes(result.recentNotes);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    getStatistics();
  }, []);

  const handleCreateNote = () => {
    router.push("/note/new");
  };

  const handleViewAllNotes = () => {
    router.push("/notes");
  };

  const handleNoteClick = (noteId) => {
    router.push(`/note/${noteId}`);
  };

  return (
    <>
      {/* Welcome section */}
      <div className="mb-4">
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {greeting}, {user?.username || "User"}!
              </h2>
              <p className="text-gray-500 text-lg">
                Ready to capture your thoughts?
              </p>
            </div>
            <Space className="mt-4 md:mt-0">
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={handleCreateNote}
              >
                New Note
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="text-center h-full bg-blue-50">
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Total Notes"
              value={stats?.total || 0}
              prefix={<FileOutlined />}
              valueStyle={{ color: "#1677ff" }}
            />
          )}
        </Card>
        <Card className="text-center h-full bg-green-50">
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Recent Notes"
              value={stats?.recent || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          )}
        </Card>
        <Card className="text-center h-full bg-yellow-50">
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Favorites"
              value={stats?.favorites || 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          )}
        </Card>
        <Card className="text-center h-full bg-purple-50">
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Statistic
              title="Folders"
              value={stats?.folders || 0}
              prefix={<FolderOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          )}
        </Card>
      </div>

      {/* Recent notes */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Recent Notes</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            Failed to load recent notes
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotes.map((note) => (
              <Card
                key={note._id}
                hoverable
                
                className="group cursor-pointer transition-all duration-300"
                onClick={() => handleNoteClick(note._id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-green-50 mr-3">
                      <EditOutlined
                        style={{ fontSize: "16px", color: "#52c41a" }}
                      />
                    </div>
                    <h3 className="font-medium text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                      {note.name || "Untitled Note"}
                    </h3>
                  </div>
                  {note.favorite && (
                    <StarOutlined className="text-yellow-500 text-lg" />
                  )}
                </div>

                <div className="mt-2 text-gray-600 line-clamp-2 overflow-hidden text-sm border-l-2 border-green-200 pl-3">
                  {note.content ? (
                    <div className="prose prose-sm max-w-none">
                      {note.content || (
                        <span className="text-gray-400 italic">No content</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No content</span>
                  )}
                </div>

                <div className="mt-3 pt-2 text-xs text-gray-400 border-t border-gray-100">
                  <div className="flex items-center">
                    <ClockCircleOutlined className="mr-1" />
                    <span>
                      Updated: {new Date(note.updatedAt).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(note.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No recent notes"
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNote}
            >
              Create your first note
            </Button>
          </Empty>
        )}
      </div>
    </>
  );
}
