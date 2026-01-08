import { useState } from 'react'
import { Poppins } from 'next/font/google'
import { Button } from '@bsg/ui/button'
// not used
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@bsg/ui/dialog"
import { Label } from "@bsg/ui/label"
import { Slider } from "@bsg/ui/slider"
import { ScrollArea } from "@bsg/ui/scroll-area"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faDoorOpen, faMinus } from '@fortawesome/free-solid-svg-icons'

const poppins = Poppins({ weight: '400', subsets: ['latin'] })

interface Topic {
  name: string
  numberOfProblems: number
  isSelected: boolean
}

enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard'
}

const IncDecButtons = ({ decrementOnClick, incrementOnClick }: { decrementOnClick: () => void; incrementOnClick: () => void }) => (
  <div className="flex items-center gap-2">
    <Button size="sm" variant="outline" onClick={decrementOnClick} className="h-8 w-8 p-0">
      <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
    </Button>
    <Button size="sm" variant="outline" onClick={incrementOnClick} className="h-8 w-8 p-0">
      <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
    </Button>
  </div>
)

const NumberOfProblemsWithDifficultyLabel = ({ difficulty, num }: { difficulty: Difficulty; num: number }) => {
  const getColorClass = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.Easy: return 'text-green-500'
      case Difficulty.Medium: return 'text-yellow-500'
      case Difficulty.Hard: return 'text-red-500'
      default: return 'text-gray-500'
    }
  }
  return <span className={`text-lg font-medium ${getColorClass(difficulty)}`}>{difficulty}: {num}</span>
}

const TopicComponent = ({ topic, toggle }: { topic: Topic; toggle: () => void }) => {
  return (
    <button
      onClick={toggle}
      className={`px-3 py-1 rounded-md text-sm border transition-colors ${
        topic.isSelected
          ? 'bg-green-500 text-white border-green-500' // use green when selected
          : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500'
      }`}
      aria-pressed={topic.isSelected}
    >
      {topic.name} ({topic.numberOfProblems})
    </button>
  )
}

interface RoomChoiceProps {
  onJoin: (roomCode: string) => void
  onCreate: (roomCode: string, options: { easy: number; medium: number; hard: number; duration: number }) => void
}

export default function RoomChoice({ onJoin, onCreate }: RoomChoiceProps) {
  const [joinCode, setJoinCode] = useState('')
  const [showCreateOptions, setShowCreateOptions] = useState(false)

  const [numberOfEasyProblems, setNumberOfEasyProblems] = useState(1)
  const [numberOfMediumProblems, setNumberOfMediumProblems] = useState(0)
  const [numberOfHardProblems, setNumberOfHardProblems] = useState(0)
  const [duration, setDuration] = useState(30)
  const [total, setTotal] = useState(1)
  const minNumberOfProblems = 0
  const maxNumberOfProblems = 10

  const [topics, setTopics] = useState<Topic[]>([
    {name: "Arrays", numberOfProblems: 214, isSelected: false},
    {name: "Strings", numberOfProblems: 180, isSelected: false},
    {name: "Hash Tables", numberOfProblems: 156, isSelected: false},
    {name: "Dynamic Programming", numberOfProblems: 203, isSelected: false},
    {name: "Trees", numberOfProblems: 175, isSelected: false},
    {name: "Graphs", numberOfProblems: 142, isSelected: false},
    {name: "Linked Lists", numberOfProblems: 98, isSelected: false},
    {name: "Binary Search", numberOfProblems: 87, isSelected: false},
    {name: "Two Pointers", numberOfProblems: 125, isSelected: false},
    {name: "Sliding Window", numberOfProblems: 76, isSelected: false},
    {name: "Backtracking", numberOfProblems: 91, isSelected: false},
    {name: "Greedy", numberOfProblems: 134, isSelected: false},
  ])

  const decrement = (setter: (v: number) => void, val: number) => {
    if (total <= 1 || val <= minNumberOfProblems) return
    setter(val - 1)
    setTotal(total - 1)
  }

  const increment = (setter: (v: number) => void, val: number) => {
    if (total >= maxNumberOfProblems) return
    setter(val + 1)
    setTotal(total + 1)
  }

  const handleCreateRoom = () => {
    const roomSettings = { easy: numberOfEasyProblems, medium: numberOfMediumProblems, hard: numberOfHardProblems, duration }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let code = ''
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    onCreate(code, roomSettings)
  }

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return
    onJoin(joinCode.trim())
  }

  const toggleTopic = (index: number) => {
    setTopics(prev => {
      const copy = [...prev]
      copy[index].isSelected = !copy[index].isSelected
      return copy
    })
  }

  return (
    <div className={`${poppins.className} min-h-screen flex items-center justify-center bg-gradient-to-b from-[#141416] to-[#101012] px-4 py-8`}>
      <div className="w-full max-w-lg p-8 rounded-2xl bg-gradient-to-b from-[#1f1f22] to-[#161617] border border-gray-700/60 shadow-lg hover:shadow-xl transition">
        <h1 className="text-2xl text-white font-semibold mb-4">Create a room or join one</h1>

        <div className="space-y-4">
          {/* Create Room - opens a focused modal dialog (create only) */}
          <Button
          onClick={() => setShowCreateOptions(true)}
          className="px-4 py-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
          >
            <FontAwesomeIcon icon={faPlus}/> Create Room
            </Button>


          {/* Modal for create options only */}
          {showCreateOptions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg p-6 rounded-2xl bg-gradient-to-b from-[#1f1f22] to-[#161617] border border-gray-700/60 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl text-white font-semibold">Create Room</h2>
                <button
                onClick={() => setShowCreateOptions(false)}
                aria-label="Close create dialog"
                title="Close"
                className="text-gray-300 hover:text-white rounded focus:outline-none p-1 transition-transform duration-200 hover:scale-125"
                >
                  <span aria-hidden className="text-5xl font-light leading-none">×</span>
                  </button>
                </div>

                <div className="grid gap-4 py-2">
                  <div className="flex items-center justify-between">
                    <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Easy} num={numberOfEasyProblems}/>
                    <IncDecButtons decrementOnClick={() => decrement(setNumberOfEasyProblems, numberOfEasyProblems)}
                                    incrementOnClick={() => increment(setNumberOfEasyProblems, numberOfEasyProblems)}/>
                  </div>
                  <div className="flex items-center justify-between">
                    <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Medium} num={numberOfMediumProblems}/>
                    <IncDecButtons decrementOnClick={() => decrement(setNumberOfMediumProblems, numberOfMediumProblems)}
                                    incrementOnClick={() => increment(setNumberOfMediumProblems, numberOfMediumProblems)}/>
                  </div>
                  <div className="flex items-center justify-between">
                    <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Hard} num={numberOfHardProblems}/>
                    <IncDecButtons decrementOnClick={() => decrement(setNumberOfHardProblems, numberOfHardProblems)}
                                    incrementOnClick={() => increment(setNumberOfHardProblems, numberOfHardProblems)}/>
                  </div>

                  <div>
                    <Label className="text-lg">Select Topics</Label>
                    <ScrollArea className="max-h-32 overflow-y-auto rounded-md p-2 mt-2 border-2 border-inputBackground">
                      <div className="flex flex-wrap gap-2">
                        {topics.map((t, i) => <TopicComponent key={i} topic={t} toggle={() => toggleTopic(i)}/>)}
                      </div>
                    </ScrollArea>
                  </div>

                  <div>
                    <Label className="text-lg">Duration: {duration} mins</Label>
                    <Slider min={5} max={120} step={5} value={[duration]} onValueChange={(v) => setDuration(v[0])} className={'pt-2'}/>
                  </div>

                  <div className="flex justify-between mt-2">
                    <Button
                    onClick={handleCreateRoom}
                    className="px-4 py-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
                    >
                      <FontAwesomeIcon icon={faPlus}/> Create Room
                      </Button>
                    
                    <Button onClick={() => setShowCreateOptions(false)} className="px-4 py-2">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Join Room */}
          <div className="flex gap-2 mt-2">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                   placeholder="Enter room code"
                   className="flex-1 px-3 py-2 rounded-lg bg-[#121214] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            <Button
            onClick={handleJoinRoom}
            className="px-4 py-2 flex items-center gap-1 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
            >
              <FontAwesomeIcon icon={faDoorOpen}/> Join
              </Button>

          </div>
        </div>
      </div>
    </div>
  )
}
