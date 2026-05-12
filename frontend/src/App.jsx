import { useEffect, useState } from 'react';

const API_BASE = '/api';

async function fetchModelsApi() {
  const response = await fetch(`${API_BASE}/models`);

  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }

  return response.json();
}

async function inferApi(modelName, prompt) {
  const response = await fetch(
    `${API_BASE}/models/${modelName}/infer`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        n_predict: 128
      })
    }
  );

  if (!response.ok) {
    throw new Error('Inference request failed');
  }

  return response.json();
}

async function uploadModelApi(payload) {
  const response = await fetch(`${API_BASE}/models`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Model deployment failed');
  }

  return response.json();
}

export default function App() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

  const [messages, setMessages] = useState({});

  const [input, setInput] = useState('');

  const [loading, setLoading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadData, setUploadData] = useState({
    name: '',
    modelUrl: '',
    runtime: 'llama.cpp'
  });

  useEffect(() => {
    fetchModels();

    const savedChats = localStorage.getItem('platform-chats');

    if (savedChats) {
      setMessages(JSON.parse(savedChats));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'platform-chats',
      JSON.stringify(messages)
    );
  }, [messages]);

  async function fetchModels() {
    try {
      const data = await fetchModelsApi();

      setModels(data);

      if (data.length > 0 && !selectedModel) {
        setSelectedModel(data[0]);
      }

    } catch (error) {
      console.error(error);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !selectedModel || loading) {
      return;
    }

    const userMessage = {
      role: 'user',
      content: input
    };

    const existingMessages =
      messages[selectedModel.name] || [];

    setMessages(prev => ({
      ...prev,
      [selectedModel.name]: [
        ...existingMessages,
        userMessage
      ]
    }));

    const prompt = input;

    setInput('');
    setLoading(true);

    try {
      const data = await inferApi(
        selectedModel.name,
        prompt
      );

      const assistantMessage = {
        role: 'assistant',
        content:
          data.response ||
          data.content ||
          'No response generated'
      };

      setMessages(prev => ({
        ...prev,
        [selectedModel.name]: [
          ...(prev[selectedModel.name] || []),
          assistantMessage
        ]
      }));

    } catch (error) {
      console.error(error);

      const assistantMessage = {
        role: 'assistant',
        content: 'Inference request failed.'
      };

      setMessages(prev => ({
        ...prev,
        [selectedModel.name]: [
          ...(prev[selectedModel.name] || []),
          assistantMessage
        ]
      }));

    } finally {
      setLoading(false);
    }
  }

  const currentMessages = selectedModel
    ? messages[selectedModel.name] || []
    : [];

  return (
    <div className="h-screen bg-zinc-950 text-white flex overflow-hidden">

      {/* Sidebar */}

      <aside className="w-80 border-r border-zinc-800 bg-zinc-900 flex flex-col">

        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-2xl font-bold">
            ML Platform
          </h1>

          <p className="text-sm text-zinc-400 mt-1">
            Kubernetes-native inference platform
          </p>
        </div>

        {/* Endpoint */}

        <div className="p-4 border-b border-zinc-800">

          <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Connected Endpoint
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm break-all text-green-400">
            /api
          </div>
        </div>

        {/* Models */}

        <div className="flex-1 overflow-y-auto p-4">

          <div className="flex items-center justify-between mb-4">

            <h2 className="font-semibold">
              Models
            </h2>

            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-black text-sm px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition"
            >
              + Upload
            </button>
          </div>

          <div className="space-y-2">

            {models.map(model => (

              <button
                key={model.name}
                onClick={() => setSelectedModel(model)}
                className={`w-full text-left border rounded-xl p-3 transition ${
                  selectedModel?.name === model.name
                    ? 'bg-zinc-800 border-zinc-600'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-500'
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>
                    <div className="font-medium">
                      {model.name}
                    </div>

                    <div className="text-xs text-zinc-400 mt-1">
                      {model.runtime}
                    </div>
                  </div>

                  <div className="w-2 h-2 rounded-full bg-green-400" />

                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}

      <main className="flex-1 flex flex-col bg-zinc-950">

        {/* Header */}

        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold">
              {selectedModel?.name || 'No model selected'}
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Runtime: {selectedModel?.runtime || 'Unknown'}
            </p>

          </div>

          <button
            onClick={() => {
              if (!selectedModel) return;

              setMessages(prev => ({
                ...prev,
                [selectedModel.name]: []
              }));
            }}
            className="border border-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-900 transition text-sm"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages */}

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {currentMessages.map((message, index) => (

            <div
              key={index}
              className={`flex ${
                message.role === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >

              <div
                className={`max-w-3xl px-5 py-4 rounded-2xl leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-white text-black rounded-br-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-md'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">

              <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-5 py-4 rounded-2xl rounded-bl-md">
                Generating response...
              </div>

            </div>
          )}
        </div>

        {/* Input */}

        <div className="border-t border-zinc-800 p-5">

          <div className="flex gap-3 items-end">

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Send a prompt..."
              className="flex-1 resize-none bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 outline-none focus:border-zinc-600 min-h-[60px] max-h-[200px]"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-white text-black px-5 py-4 rounded-2xl font-medium hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'Send'}
            </button>

          </div>
        </div>
      </main>

      {/* Upload Modal */}

      {showUploadModal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                Deploy Model
              </h2>

              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              <input
                placeholder="Model Name"
                value={uploadData.name}
                onChange={(e) =>
                  setUploadData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-zinc-600"
              />

              <input
                placeholder="GGUF Model URL"
                value={uploadData.modelUrl}
                onChange={(e) =>
                  setUploadData(prev => ({
                    ...prev,
                    modelUrl: e.target.value
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-zinc-600"
              />

              <select
                value={uploadData.runtime}
                onChange={(e) =>
                  setUploadData(prev => ({
                    ...prev,
                    runtime: e.target.value
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-zinc-600"
              >
                <option value="llama.cpp">
                  llama.cpp
                </option>

                <option value="onnx">
                  onnx
                </option>
              </select>

              <button
                onClick={async () => {
                  try {
                    await uploadModelApi(uploadData);

                    await fetchModels();

                    setShowUploadModal(false);

                    setUploadData({
                      name: '',
                      modelUrl: '',
                      runtime: 'llama.cpp'
                    });

                  } catch (error) {
                    console.error(error);
                    alert('Failed to deploy model');
                  }
                }}
                className="w-full bg-white text-black py-3 rounded-2xl font-semibold hover:bg-zinc-200 transition"
              >
                Deploy Model
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}